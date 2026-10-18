import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/db/client';
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
    const [cCount, sCount, tCount, oCount, recentPayments] = await withTenantContext(tenantId, async (tx) => Promise.all([
      tx.customer.count({ where: { tenantId, archived: false, status: 'active' } }),
      tx.service.count({ where: { tenantId, status: 'active' } }),
      tx.ticket.count({ where: { tenantId, status: 'open' } }),
      tx.order.count({ where: { tenantId, status: 'awaiting_payment' } }),
      tx.payment.findMany({
        where: { tenantId, status: 'succeeded' },
        select: { amount: true },
        take: 100,
      }),
    ]));
    activeCustomersCount = cCount;
    activeServicesCount = sCount;
    openTicketsCount = tCount;
    pendingOrdersCount = oCount;
    totalRevenue = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  } catch {
    return NextResponse.json({ error: 'Analytics data is temporarily unavailable.' }, { status: 503 });
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
