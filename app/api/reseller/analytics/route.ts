import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId parameter is required' }, { status: 400 });
  }

  try {
    await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let activeCustomersCount = 0;
  let activeServicesCount = 0;
  let openTicketsCount = 0;
  let pendingOrdersCount = 0;
  let totalRevenue = 0;

  try {
    const [cCount, sCount, tCount, oCount, recentPayments] = await Promise.all([
      prisma.customer.count({ where: { tenantId, archived: false, status: 'active' } }),
      prisma.service.count({ where: { tenantId, status: 'active' } }),
      prisma.ticket.count({ where: { tenantId, status: 'open' } }),
      prisma.order.count({ where: { tenantId, status: 'awaiting_payment' } }),
      prisma.payment.findMany({
        where: { tenantId, status: 'succeeded' },
        select: { amount: true },
        take: 100,
      }),
    ]);
    activeCustomersCount = cCount;
    activeServicesCount = sCount;
    openTicketsCount = tCount;
    pendingOrdersCount = oCount;
    totalRevenue = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  } catch {
    const { getLocalDb, resolveLocalTenantId } = await import('@/lib/db/local-db');
    const db = getLocalDb();
    const resolved = resolveLocalTenantId(tenantId);
    const c = db.prepare("SELECT count(*) as count FROM customers WHERE tenant_id = ? AND archived = 0 AND status = 'active'").get(resolved) as any;
    const s = db.prepare("SELECT count(*) as count FROM services WHERE tenant_id = ? AND status = 'active'").get(resolved) as any;
    const t = db.prepare("SELECT count(*) as count FROM tickets WHERE tenant_id = ? AND status = 'open'").get(resolved) as any;
    const o = db.prepare("SELECT count(*) as count FROM orders WHERE tenant_id = ? AND status = 'awaiting_payment'").get(resolved) as any;
    const rev = db.prepare("SELECT sum(amount) as sum FROM payments WHERE tenant_id = ?").get(resolved) as any;

    activeCustomersCount = c?.count || 0;
    activeServicesCount = s?.count || 0;
    openTicketsCount = t?.count || 0;
    pendingOrdersCount = o?.count || 0;
    totalRevenue = Number(rev?.sum || 0);
  }

  return NextResponse.json({
    metrics: {
      activeCustomers: activeCustomersCount,
      activeServices: activeServicesCount,
      openTickets: openTicketsCount,
      pendingOrders: pendingOrdersCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
  });
}
