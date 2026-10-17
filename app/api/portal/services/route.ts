import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { listCustomerServices } from '@/lib/services/service.service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId parameter is required' }, { status: 400 });
  }

  let customer;
  try {
    const auth = await requireCustomer(tenantId, undefined, req);
    customer = auth.customer;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  const services = await listCustomerServices(tenantId, customer.id);
  return NextResponse.json({ services });
}
