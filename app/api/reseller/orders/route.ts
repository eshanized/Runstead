import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { listOrders, createOrder } from '@/lib/services/order.service';

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      cycle: z.string().min(1),
      quantity: z.number().int().min(1),
    })
  ).min(1),
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
  const status = url.searchParams.get('status') || undefined;

  const result = await listOrders(tenantId, { page, limit, status });
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
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin', 'billing'], req);
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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const result = await createOrder(tenantId, parsed.data.customerId, parsed.data.items, user.id);
    return NextResponse.json({ success: true, order: result.order, invoice: result.invoice }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create order' }, { status: 400 });
  }
}
