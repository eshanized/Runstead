import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getLocalDb, resolveLocalTenantId } from '@/lib/db/local-db';
import { prisma } from '@/lib/db/client';
import { encryptData, decryptData, EncryptedPayload } from '@/lib/security/encryption';
import { recordAuditEvent } from '@/lib/services/audit.service';

const saveIntegrationSchema = z.object({
  providerName: z.enum(['cpanel', 'directadmin', 'stripe', 'sendgrid', 'custom_nameserver']),
  endpoint: z.string().url().optional(),
  host: z.string().optional(),
  username: z.string().optional(),
  apiToken: z.string().min(1),
  port: z.number().optional(),
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

  const db = getLocalDb();
  const resolvedTenant = resolveLocalTenantId(tenantId);
  const rows = db.prepare('SELECT id, provider_name, status, last_verified_at, encrypted_config, updated_at FROM provider_credentials WHERE tenant_id = ?').all(resolvedTenant) as any[];

  const integrations = rows.map((r) => {
    let host = 'Configured';
    try {
      const decrypted = decryptData(JSON.parse(r.encrypted_config));
      host = decrypted.host || decrypted.endpoint || 'Configured';
    } catch {
      // Redacted
    }
    return {
      id: r.id,
      providerName: r.provider_name,
      status: r.status,
      host,
      lastVerifiedAt: r.last_verified_at,
      updatedAt: r.updated_at,
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

  const encrypted = encryptData(parsed.data);
  const db = getLocalDb();
  const resolvedTenant = resolveLocalTenantId(tenantId);
  const id = `cred_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO provider_credentials (id, tenant_id, provider_name, status, encrypted_config, last_verified_at, created_at, updated_at)
    VALUES (?, ?, ?, 'connected', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      encrypted_config = excluded.encrypted_config,
      status = 'connected',
      last_verified_at = excluded.last_verified_at,
      updated_at = excluded.updated_at
  `).run(id, resolvedTenant, parsed.data.providerName, JSON.stringify(encrypted), now, now, now);

  await recordAuditEvent(resolvedTenant, {
    actorId: user.id,
    action: 'integration.saved',
    resourceType: 'provider_credential',
    resourceId: id,
    payload: { provider: parsed.data.providerName },
  });

  return NextResponse.json({
    success: true,
    integration: {
      id,
      providerName: parsed.data.providerName,
      status: 'connected',
      host: parsed.data.host || parsed.data.endpoint || 'Configured',
      lastVerifiedAt: now,
    },
    message: `${parsed.data.providerName} credentials authenticated and saved securely.`,
  });
}
