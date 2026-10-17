import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/client';
import { getLocalDb, resolveLocalTenantId } from '@/lib/db/local-db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

  try {
    const { user, customer } = await requireCustomer(tenantId, undefined, req);

    // Fetch counts and metrics for the customer
    let servicesCount = 0;
    let invoicesCount = 0;
    let domainsCount = 0;
    let openTicketsCount = 0;

    try {
      [servicesCount, invoicesCount, domainsCount, openTicketsCount] = await Promise.all([
        prisma.service.count({ where: { tenantId: customer.tenantId, customerId: customer.id, status: 'active' } }),
        prisma.invoice.count({ where: { tenantId: customer.tenantId, customerId: customer.id } }),
        prisma.domain.count({ where: { tenantId: customer.tenantId, customerId: customer.id } }),
        prisma.ticket.count({ where: { tenantId: customer.tenantId, customerId: customer.id, status: { in: ['open', 'in_progress'] } } }),
      ]);
    } catch {
      const db = getLocalDb();
      const resolved = resolveLocalTenantId(customer.tenantId);
      servicesCount = (db.prepare('SELECT COUNT(*) as count FROM services WHERE tenant_id = ? AND customer_id = ? AND status = "active"').get(resolved, customer.id) as any)?.count || 0;
      invoicesCount = (db.prepare('SELECT COUNT(*) as count FROM invoices WHERE tenant_id = ? AND customer_id = ?').get(resolved, customer.id) as any)?.count || 0;
      domainsCount = (db.prepare('SELECT COUNT(*) as count FROM domains WHERE tenant_id = ? AND customer_id = ?').get(resolved, customer.id) as any)?.count || 0;
      openTicketsCount = (db.prepare('SELECT COUNT(*) as count FROM tickets WHERE tenant_id = ? AND customer_id = ? AND status IN ("open", "in_progress")').get(resolved, customer.id) as any)?.count || 0;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        company: customer.company,
        status: customer.status,
        country: customer.country,
        creditBalance: Number(customer.creditBalance),
        servicesCount,
        invoicesCount,
        domainsCount,
        openTicketsCount,
      },
    });
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json(
      { authenticated: false, error: err instanceof Error ? err.message : 'Unauthorized' },
      { status }
    );
  }
}
