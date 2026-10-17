import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';

const domainCreateSchema = z.object({
  domain: z.string().min(3).max(255),
  customerId: z.string().min(1),
  autoRenew: z.boolean().default(true),
  nameservers: z.array(z.string()).default(['ns1.runstead.net', 'ns2.runstead.net']),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let domains: any[] = [];
  try {
    domains = await prisma.domain.findMany({
      where: { tenantId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    const { getLocalDb, resolveLocalTenantId } = await import('@/lib/db/local-db');
    const db = getLocalDb();
    const resolved = resolveLocalTenantId(tenantId);
    const rows = db.prepare(`
      SELECT d.*, c.name as customer_name, c.email as customer_email
      FROM domains d
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE d.tenant_id = ?
      ORDER BY d.created_at DESC
    `).all(resolved) as any[];

    domains = rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      customerId: r.customer_id,
      domain: r.domain,
      status: r.status,
      registeredAt: r.registered_at,
      expiresAt: r.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: Boolean(r.auto_renew),
      nameservers: r.nameservers ? JSON.parse(r.nameservers) : ['ns1.runstead.net', 'ns2.runstead.net'],
      dnsZoneId: r.dns_zone_id,
      customer: {
        id: r.customer_id,
        name: r.customer_name || 'Customer',
        email: r.customer_email || '',
      },
    }));
  }

  return NextResponse.json({ domains });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing'], req);
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
  const domainId = `dom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  let created: any = null;
  try {
    created = await prisma.domain.create({
      data: {
        id: domainId,
        tenantId,
        customerId,
        domainName: domain,
        status: 'active',
        autoRenew,
        expiryDate: new Date(expiresAt),
      },
    });
  } catch {
    const { getLocalDb, resolveLocalTenantId } = await import('@/lib/db/local-db');
    const db = getLocalDb();
    const resolved = resolveLocalTenantId(tenantId);
    db.prepare(`
      INSERT INTO domains (id, tenant_id, customer_id, domain, status, auto_renew, expires_at, nameservers)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
    `).run(domainId, resolved, customerId, domain, autoRenew ? 1 : 0, expiresAt, JSON.stringify(nameservers));

    created = {
      id: domainId,
      tenantId: resolved,
      customerId,
      domain,
      status: 'active',
      autoRenew,
      expiresAt,
      nameservers,
    };
  }

  return NextResponse.json({ success: true, domain: created }, { status: 201 });
}
