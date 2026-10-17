import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireResellerStaff, AuthenticationError } from '@/lib/auth/guards';
import { listProducts, createProduct } from '@/lib/services/product.service';

const createProductSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  description: z.string(),
  setupFee: z.number().min(0).optional(),
  available: z.boolean().optional(),
  pricing: z.array(
    z.object({
      cycle: z.string().min(1),
      price: z.number().min(0),
    })
  ).min(1),
  resourceLimits: z.record(z.any()).optional(),
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

  const products = await listProducts(tenantId);
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId parameter is required' }, { status: 400 });
  }

  let user;
  try {
    const auth = await requireResellerStaff(tenantId, ['owner', 'admin'], req);
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

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const product = await createProduct(tenantId, parsed.data, user.id);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create product' }, { status: 400 });
  }
}
