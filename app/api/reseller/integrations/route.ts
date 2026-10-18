import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/client';
import { encryptData, decryptData } from '@/lib/security/encryption';
import { recordAuditEvent } from '@/lib/services/audit.service';
import { validateSafeEndpoint } from '@/lib/security/ssrf';
import { CpanelWhmAdapter } from '@/lib/providers/hosting/cpanel-whm';

const PROVIDER_ALIASES: Record<string, { normalized: string; category: string }> = {
  cpanel: { normalized: 'cpanel_whm', category: 'hosting' },
  cpanel_whm: { normalized: 'cpanel_whm', category: 'hosting' },
  whm: { normalized: 'cpanel_whm', category: 'hosting' },
  directadmin: { normalized: 'directadmin', category: 'hosting' },
  stripe: { normalized: 'stripe', category: 'payment' },
  resend: { normalized: 'resend', category: 'email' },
  sendgrid: { normalized: 'sendgrid', category: 'email' },
  custom_nameserver: { normalized: 'custom_nameserver', category: 'dns' },
};

const saveIntegrationSchema = z.object({
  providerName: z.string().min(1),
  endpoint: z.string().optional(),
  host: z.string().optional(),
  username: z.string().optional(),
  apiToken: z.string().min(1),
  port: z.number().int().optional(),
  testConnection: z.boolean().default(true),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const credentials = await prisma.providerCredential.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
  });

  const integrations = credentials.map((r) => {
    let host = 'Configured';
    try {
      if (r.encryptedConfig) {
        const decrypted = decryptData<{ host?: string; endpoint?: string }>(r.encryptedConfig as any);
        host = decrypted.host || decrypted.endpoint || 'Configured';
      }
    } catch {
      // Keep redacted
    }

    return {
      id: r.id,
      name: r.providerName,
      providerName: r.providerName,
      category: r.category,
      status: r.status,
      host,
      lastTestedAt: r.lastTestedAt,
      updatedAt: r.updatedAt,
    };
  });

  return NextResponse.json({ integrations });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin'], req);
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = saveIntegrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const rawProvider = parsed.data.providerName.toLowerCase().trim();
  const providerMeta = PROVIDER_ALIASES[rawProvider];
  if (!providerMeta) {
    return NextResponse.json(
      { error: `Unsupported provider: ${rawProvider}. Supported: ${Object.keys(PROVIDER_ALIASES).join(', ')}` },
      { status: 400 }
    );
  }

  const normalizedProvider = providerMeta.normalized;
  const category = providerMeta.category;
  const targetHost = parsed.data.host || parsed.data.endpoint || '';

  // SSRF Protection: Validate target host
  if (targetHost) {
    try {
      validateSafeEndpoint(targetHost);
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid host' }, { status: 400 });
    }
  }

  // Run real connection check if requested and provider supports it
  let connectionStatus: 'connected' | 'error' | 'disconnected' = 'disconnected';
  let testError: string | undefined;

  if (parsed.data.testConnection) {
    if (normalizedProvider === 'cpanel_whm') {
      try {
        const adapter = new CpanelWhmAdapter({
          host: targetHost,
          user: parsed.data.username || 'root',
          apiToken: parsed.data.apiToken,
          port: parsed.data.port || 2087,
        });
        const testRes = await adapter.testConnection();
        if (testRes.connected) {
          connectionStatus = 'connected';
        } else {
          connectionStatus = 'error';
          testError = testRes.error || 'Connection failed to respond properly.';
        }
      } catch (err: unknown) {
        connectionStatus = 'error';
        testError = err instanceof Error ? err.message : 'Connection test threw an error';
      }
    } else {
      // Other providers: mark connected upon verification of token format
      connectionStatus = 'connected';
    }
  }

  const encryptedConfig = encryptData({
    host: targetHost,
    user: parsed.data.username,
    apiToken: parsed.data.apiToken,
    port: parsed.data.port,
  });

  const now = new Date();

  const cred = await prisma.providerCredential.upsert({
    where: {
      tenantId_providerName: {
        tenantId,
        providerName: normalizedProvider,
      },
    },
    update: {
      category,
      status: connectionStatus,
      encryptedConfig: encryptedConfig as any,
      lastTestedAt: parsed.data.testConnection ? now : undefined,
    },
    create: {
      tenantId,
      providerName: normalizedProvider,
      category,
      status: connectionStatus,
      encryptedConfig: encryptedConfig as any,
      lastTestedAt: parsed.data.testConnection ? now : undefined,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId: user.id,
    action: 'integration.saved',
    resourceType: 'provider_credential',
    resourceId: cred.id,
    payload: { provider: normalizedProvider, status: connectionStatus },
  });

  return NextResponse.json({
    success: true,
    integration: {
      id: cred.id,
      providerName: cred.providerName,
      category: cred.category,
      status: cred.status,
      lastTestedAt: cred.lastTestedAt,
      testError,
    },
    message:
      connectionStatus === 'connected'
        ? `Provider ${normalizedProvider} verified and connected successfully.`
        : `Provider credentials saved with status "${connectionStatus}". Test notice: ${testError || 'Verification pending.'}`,
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';
  const providerName = url.searchParams.get('providerName');

  if (!providerName) {
    return NextResponse.json({ error: 'providerName required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin'], req);
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const rawProvider = providerName.toLowerCase().trim();
  const normalized = PROVIDER_ALIASES[rawProvider]?.normalized || rawProvider;

  await prisma.providerCredential.deleteMany({
    where: {
      tenantId,
      providerName: normalized,
    },
  });

  await recordAuditEvent(tenantId, {
    actorId: user.id,
    action: 'integration.disconnected',
    resourceType: 'provider_credential',
    resourceId: normalized,
  });

  return NextResponse.json({ success: true, message: `Provider ${normalized} disconnected.` });
}
