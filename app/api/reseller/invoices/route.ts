import { NextResponse } from 'next/server';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { listInvoices } from '@/lib/services/invoice.service';

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

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const customerId = url.searchParams.get('customerId') || undefined;
  const status = url.searchParams.get('status') || undefined;

  const result = await listInvoices(tenantId, { page, limit, customerId, status });
  return NextResponse.json(result);
}
