import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { withTenantContext } from '@/lib/db/client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ authenticated: false, error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const { user, customer } = await requireCustomer(tenantId, undefined, req);
    const [servicesCount, invoicesCount, domainsCount, openTicketsCount] = await withTenantContext(customer.tenantId, async (tx) =>
      Promise.all([
        tx.service.count({ where: { tenantId: customer.tenantId, customerId: customer.id, status: 'active' } }),
        tx.invoice.count({ where: { tenantId: customer.tenantId, customerId: customer.id } }),
        tx.domain.count({ where: { tenantId: customer.tenantId, customerId: customer.id } }),
        tx.ticket.count({ where: { tenantId: customer.tenantId, customerId: customer.id, status: { in: ['open', 'in_progress'] } } }),
      ])
    );

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
    if (err instanceof AuthenticationError) {
      const status = err.message.includes('required') || err.message.includes('session') ? 401 : 403;
      return NextResponse.json(
        { authenticated: false, error: err.message },
        { status }
      );
    }
    return NextResponse.json(
      { authenticated: false, error: 'Customer dashboard data is temporarily unavailable.' },
      { status: 503 }
    );
  }
}
