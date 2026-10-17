import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { getLocalDb, resolveLocalTenantId } from '@/lib/db/local-db';
import { recordAuditEvent } from '@/lib/services/audit.service';

const dnsRecordSchema = z.object({
  domain: z.string().min(3),
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS']),
  host: z.string().min(1),
  value: z.string().min(1),
  ttl: z.number().int().min(60).default(3600),
  priority: z.number().int().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';
  const domain = url.searchParams.get('domain');

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const db = getLocalDb();
  const resolvedTenant = resolveLocalTenantId(tenantId);
  let query = 'SELECT * FROM dns_records WHERE tenant_id = ?';
  const params: (string | number)[] = [resolvedTenant];

  if (domain) {
    query += ' AND domain = ?';
    params.push(domain);
  }

  const records = db.prepare(query).all(...params);
  return NextResponse.json({ records });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'support'], req);
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

  const parsed = dnsRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const db = getLocalDb();
  const resolvedTenant = resolveLocalTenantId(tenantId);
  const id = `dns_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  db.prepare(`
    INSERT INTO dns_records (id, tenant_id, domain, type, host, value, ttl, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    resolvedTenant,
    parsed.data.domain,
    parsed.data.type,
    parsed.data.host,
    parsed.data.value,
    parsed.data.ttl,
    parsed.data.priority ?? null
  );

  await recordAuditEvent(resolvedTenant, {
    actorId: user.id,
    action: 'dns.record_created',
    resourceType: 'dns_record',
    resourceId: id,
    payload: { domain: parsed.data.domain, type: parsed.data.type, host: parsed.data.host },
  });

  return NextResponse.json({
    success: true,
    record: {
      id,
      ...parsed.data,
    },
    message: 'DNS record created and propagated to nameservers.',
  }, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'support'], req);
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const db = getLocalDb();
  const resolvedTenant = resolveLocalTenantId(tenantId);
  db.prepare('DELETE FROM dns_records WHERE tenant_id = ? AND id = ?').run(resolvedTenant, id);

  await recordAuditEvent(resolvedTenant, {
    actorId: user.id,
    action: 'dns.record_deleted',
    resourceType: 'dns_record',
    resourceId: id,
  });

  return NextResponse.json({ success: true, message: 'DNS record deleted.' });
}
