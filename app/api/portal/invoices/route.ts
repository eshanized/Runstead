import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { listInvoices } from '@/lib/services/invoice.service';

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

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const status = url.searchParams.get('status') || undefined;

  const result = await listInvoices(customer.tenantId, {
    customerId: customer.id,
    page,
    limit,
    status,
  });

  return NextResponse.json(result);
}
