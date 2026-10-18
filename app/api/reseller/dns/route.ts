import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/client';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
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
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }
  const domain = url.searchParams.get('domain');

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let domainId: string | undefined;
  if (domain) {
    const dom = await withTenantContext(tenantId, (tx) => tx.domain.findFirst({
      where: { tenantId, domainName: domain.toLowerCase().trim() },
      select: { id: true },
    }));
    if (!dom) {
      return NextResponse.json({ records: [] });
    }
    domainId = dom.id;
  }

  const records = await withTenantContext(tenantId, (tx) => tx.dnsRecord.findMany({
    where: { tenantId, domainId },
    include: { domain: { select: { domainName: true } } },
    orderBy: { host: 'asc' },
  }));

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      domainId: r.domainId,
      domain: r.domain?.domainName || domain,
      type: r.type,
      host: r.host,
      value: r.value,
      ttl: r.ttl,
      priority: r.priority,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

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

  const normalizedDomain = parsed.data.domain.toLowerCase().trim();

  // Find or verify domain exists in this tenant
  let targetDomain = await withTenantContext(tenantId, (tx) => tx.domain.findFirst({
    where: { tenantId, domainName: normalizedDomain },
  }));

  if (!targetDomain) {
    return NextResponse.json(
      { error: 'Domain is not managed by this tenant. Create or import the domain before drafting DNS records.' },
      { status: 404 }
    );
  }

  const created = await withTenantContext(tenantId, (tx) => tx.dnsRecord.create({
    data: {
      tenantId,
      domainId: targetDomain.id,
      type: parsed.data.type,
      host: parsed.data.host.trim(),
      value: parsed.data.value.trim(),
      ttl: parsed.data.ttl,
      priority: parsed.data.priority,
    },
  }));

  await recordAuditEvent(tenantId, {
    actorId: user.id,
    action: 'dns.record_created',
    resourceType: 'dns_record',
    resourceId: created.id,
    payload: { domain: normalizedDomain, type: created.type, host: created.host },
  });

  return NextResponse.json(
    {
      success: true,
      record: {
        id: created.id,
        tenantId: created.tenantId,
        domainId: created.domainId,
        domain: normalizedDomain,
        type: created.type,
        host: created.host,
        value: created.value,
        ttl: created.ttl,
        priority: created.priority,
      },
      message: 'DNS record draft saved in Runstead only. No authoritative DNS provider was updated and no external propagation occurred.',
      providerStatus: 'not_configured',
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }
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

  await withTenantContext(tenantId, (tx) => tx.dnsRecord.delete({
    where: { tenantId_id: { tenantId, id } },
  }));

  await recordAuditEvent(tenantId, {
    actorId: user.id,
    action: 'dns.record_deleted',
    resourceType: 'dns_record',
    resourceId: id,
  });

  return NextResponse.json({ success: true, message: 'DNS record draft deleted from Runstead. No external DNS provider was changed.', providerStatus: 'not_configured' });
}
