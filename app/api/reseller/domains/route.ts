import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/client';
import { requireResellerStaff, AuthenticationError, AuthorizationError } from '@/lib/auth/guards';
import { recordAuditEvent } from '@/lib/services/audit.service';

const domainCreateSchema = z.object({
  domain: z.string().min(3).max(255),
  customerId: z.string().min(1),
  autoRenew: z.boolean().default(true),
  nameservers: z.array(z.string()).default(['ns1.runstead.net', 'ns2.runstead.net']),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const domainRows = await withTenantContext(tenantId, (tx) => tx.domain.findMany({
    where: { tenantId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      _count: { select: { dnsRecords: true } },
    },
    orderBy: { createdAt: 'desc' },
  }));

  const domains = domainRows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    customerId: r.customerId,
    domain: r.domainName,
    domainName: r.domainName,
    status: r.status,
    registeredAt: r.registeredDate,
    expiresAt: r.expiryDate,
    autoRenew: r.autoRenew,
    nameservers: r.nameservers,
    customer: r.customer,
    dnsRecordsCount: r._count?.dnsRecords || 0,
  }));

  return NextResponse.json({ domains });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'billing'], req);
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

  const parsed = domainCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const { domain, customerId, autoRenew, nameservers } = parsed.data;
  const normalizedDomain = domain.toLowerCase().trim();
  // No registrar driver is configured: this endpoint records a request only.


  // Verify customer belongs to tenant
  const customer = await withTenantContext(tenantId, (tx) => tx.customer.findUnique({
    where: { tenantId_id: { tenantId, id: customerId } },
  }));
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found in this tenant' }, { status: 404 });
  }

  const created = await withTenantContext(tenantId, (tx) => tx.domain.create({
    data: {
      tenantId,
      customerId,
      domainName: normalizedDomain,
      status: 'pending_registration',
      registrar: 'unconfigured',
      autoRenew: false,
      nameservers: [],
      registeredDate: null,
      expiryDate: null,
      domainType: 'registration_request',
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  }));

  await recordAuditEvent(tenantId, {
    actorId: user.id,
    action: 'domain.created',
    resourceType: 'domain',
    resourceId: created.id,
    payload: { domainName: created.domainName, customerId },
  });

  return NextResponse.json(
    {
      success: true,
      domain: {
        id: created.id,
        tenantId: created.tenantId,
        customerId: created.customerId,
        domain: created.domainName,
        status: created.status,
        autoRenew: created.autoRenew,
        nameservers: created.nameservers,
        expiresAt: created.expiryDate,
        customer: created.customer,
        requestedConfiguration: { autoRenew, nameservers },
        providerConfigured: false,
        message: 'Domain request recorded but not registered. No registrar, renewal, nameserver, or external DNS operation was performed.',
      },
    },
    { status: 201 }
  );
}
