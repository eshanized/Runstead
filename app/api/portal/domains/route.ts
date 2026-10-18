import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { withTenantContext } from '@/lib/db/client';

async function resolveCustomer(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  if (!tenantId) {
    throw new AuthenticationError('tenantId is required');
  }
  return requireCustomer(tenantId, undefined, req);
}

export async function GET(req: Request) {
  let customer;
  try {
    const auth = await resolveCustomer(req);
    customer = auth.customer;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  try {
    const domains = await withTenantContext(customer.tenantId, (tx) => tx.domain.findMany({
      where: { tenantId: customer.tenantId, customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    }));
    return NextResponse.json({ domains });
  } catch {
    return NextResponse.json({ error: 'Domains lookup temporarily unavailable.' }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  let customer;
  try {
    const auth = await resolveCustomer(req);
    customer = auth.customer;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  // Nameserver and auto-renewal changes require an actual registrar/DNS provider.
  // Do not persist local values while implying that public infrastructure changed.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !('domainId' in body) || typeof (body as any).domainId !== 'string') {
    return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
  }

  try {
    const domain = await withTenantContext(customer.tenantId, (tx) => tx.domain.findFirst({
      where: {
        tenantId: customer.tenantId,
        customerId: customer.id,
        id: (body as any).domainId,
      },
      select: { id: true, status: true, registrar: true },
    }));

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found.' }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Domain configuration changes are unavailable because no registrar/DNS provider is connected. No changes were made.',
      providerStatus: 'not_configured',
    }, { status: 501 });
  } catch {
    return NextResponse.json({ error: 'Domain lookup temporarily unavailable.' }, { status: 503 });
  }
}
