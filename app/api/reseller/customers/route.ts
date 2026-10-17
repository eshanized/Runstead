import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthorizationError, AuthenticationError } from '@/lib/auth/guards';
import { listCustomers, createCustomer } from '@/lib/services/customer.service';

const createCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  country: z.string().length(2).optional(),
  phone: z.string().optional(),
});

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
  const search = url.searchParams.get('search') || undefined;
  const status = url.searchParams.get('status') || undefined;

  const result = await listCustomers(tenantId, { page, limit, search, status });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId parameter is required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'billing', 'support'], req);
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const customer = await createCustomer(tenantId, parsed.data, user.id);
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create customer' }, { status: 400 });
  }
}
