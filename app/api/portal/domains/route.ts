import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/client';
import { getLocalDb, resolveLocalTenantId } from '@/lib/db/local-db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  let customer;
  try {
    const auth = await requireCustomer(tenantId, undefined, req);
    customer = auth.customer;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  try {
    const domains = await prisma.domain.findMany({
      where: {
        tenantId: customer.tenantId,
        customerId: customer.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ domains });
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Domains lookup temporarily unavailable' }, { status: 503 });
    }
    const db = getLocalDb();
    const resolved = resolveLocalTenantId(customer.tenantId);
    const rows = db.prepare('SELECT * FROM domains WHERE tenant_id = ? AND customer_id = ? ORDER BY created_at DESC').all(resolved, customer.id) as any[];
    const domains = rows.map((r) => ({
      id: r.id,
      domainName: r.domain_name,
      domain: r.domain_name,
      status: r.status,
      autoRenew: Boolean(r.auto_renew),
      registeredAt: r.created_at,
      expiryDate: r.expiry_date,
      nameservers: r.nameservers ? JSON.parse(r.nameservers) : ['ns1.runstead.net', 'ns2.runstead.net'],
    }));
    return NextResponse.json({ domains });
  }
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  let customer;
  try {
    const auth = await requireCustomer(tenantId, undefined, req);
    customer = auth.customer;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { domainId, nameservers, autoRenew } = body;
  if (!domainId) {
    return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
  }

  try {
    const updated = await prisma.domain.updateMany({
      where: {
        id: domainId,
        tenantId: customer.tenantId,
        customerId: customer.id,
      },
      data: {
        ...(autoRenew !== undefined ? { autoRenew: Boolean(autoRenew) } : {}),
      },
    });

    if (updated.count === 0) {
      // Check if found
      const exists = await prisma.domain.findFirst({ where: { id: domainId, tenantId: customer.tenantId } });
      if (exists) {
        return NextResponse.json({ error: 'Forbidden: You do not own this domain' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Domain configuration updated.' });
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Domain update temporarily unavailable' }, { status: 503 });
    }
    const db = getLocalDb();
    const resolved = resolveLocalTenantId(customer.tenantId);
    const existing = db.prepare('SELECT * FROM domains WHERE id = ? AND tenant_id = ?').get(domainId, resolved) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }
    if (existing.customer_id !== customer.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this domain' }, { status: 403 });
    }

    const nsJson = Array.isArray(nameservers) ? JSON.stringify(nameservers) : existing.nameservers;
    const renewVal = autoRenew !== undefined ? (autoRenew ? 1 : 0) : existing.auto_renew;
    db.prepare('UPDATE domains SET nameservers = ?, auto_renew = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nsJson, renewVal, domainId);

    return NextResponse.json({ success: true, message: 'Domain configuration updated.' });
  }
}
