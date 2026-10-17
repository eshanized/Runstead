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

  const [
    activeCustomersCount,
    activeServicesCount,
    openTicketsCount,
    pendingOrdersCount,
    recentPayments,
  ] = await Promise.all([
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

  const totalRevenue = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);

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
