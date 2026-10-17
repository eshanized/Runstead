import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { getAuthenticatedUser } from '@/lib/auth/guards';
import { createOrder } from '@/lib/services/order.service';
import { getPaymentGateway } from '@/lib/providers/payment/factory';
import { checkRateLimit } from '@/lib/security/rate-limit';

const checkoutSchema = z.object({
  tenantSlug: z.string().min(1),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    company: z.string().optional(),
    country: z.string().length(2).optional(),
    phone: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      cycle: z.string().min(1),
      quantity: z.number().int().min(1).default(1),
    })
  ).min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const rateLimit = checkRateLimit(`checkout:${ip}`, { windowMs: 60_000, maxRequests: 10 });

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many checkout requests. Please wait a moment.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const { tenantSlug, customer: customerInput, items, successUrl, cancelUrl } = parsed.data;

  // 1. Resolve Tenant
  let tenant: { id: string; name: string; currency: string } | null = null;
  try {
    const t = await prisma.tenant.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
    });
    if (t) tenant = t;
  } catch {
    // SQLite fallback
  }

  if (!tenant) {
    const { getLocalDb, resolveLocalTenantId } = await import('@/lib/db/local-db');
    const db = getLocalDb();
    const resolvedId = resolveLocalTenantId(tenantSlug);
    const row = db.prepare('SELECT id, name, currency FROM tenants WHERE id = ? OR slug = ?').get(resolvedId, tenantSlug.toLowerCase()) as any;
    if (row) {
      tenant = { id: row.id, name: row.name, currency: row.currency };
    }
  }

  if (!tenant) {
    return NextResponse.json({ error: 'Reseller storefront tenant not found' }, { status: 404 });
  }

  // 2. Identify or Create Customer
  const authUser = await getAuthenticatedUser(req);
  const normalizedEmail = customerInput.email.toLowerCase().trim();

  let customer: { id: string; name: string; email: string } | null = null;
  try {
    const c = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: normalizedEmail,
      },
    });

    if (!c) {
      const created = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: customerInput.name,
          email: normalizedEmail,
          company: customerInput.company,
          country: customerInput.country || 'US',
          phone: customerInput.phone,
          userId: authUser ? authUser.id : undefined,
        },
      });
      customer = created;
    } else {
      customer = c;
    }
  } catch {
    const { getLocalDb } = await import('@/lib/db/local-db');
    const db = getLocalDb();
    const row = db.prepare('SELECT id, name, email FROM customers WHERE tenant_id = ? AND email = ?').get(tenant.id, normalizedEmail) as any;
    if (row) {
      customer = row;
    } else {
      const id = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.prepare(`
        INSERT INTO customers (id, tenant_id, name, email, company, country, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, tenant.id, customerInput.name, normalizedEmail, customerInput.company || null, customerInput.country || 'US', customerInput.phone || null);
      customer = { id, name: customerInput.name, email: normalizedEmail };
    }
  }

  if (!customer) {
    return NextResponse.json({ error: 'Customer record could not be established' }, { status: 400 });
  }

  // 3. Create Authoritative Order and Invoice on Server
  let orderResult;
  try {
    orderResult = await createOrder(tenant.id, customer.id, items, authUser?.id);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Pricing calculation failed' }, { status: 400 });
  }

  const { order, invoice } = orderResult;

  // 4. Create Payment Gateway Session
  const gateway = getPaymentGateway();
  const defaultSuccessUrl = `${req.headers.get('origin') || 'http://localhost:3000'}/demo/checkout?order_id=${order.id}&invoice_id=${invoice.id}`;
  const defaultCancelUrl = `${req.headers.get('origin') || 'http://localhost:3000'}/demo/storefront-preview/cart`;

  const session = await gateway.createCheckoutSession({
    tenantId: tenant.id,
    orderId: order.id,
    invoiceId: invoice.id,
    amount: Number(order.amount),
    currency: tenant.currency || 'USD',
    customerEmail: customer.email,
    customerName: customer.name,
    successUrl: successUrl || defaultSuccessUrl,
    cancelUrl: cancelUrl || defaultCancelUrl,
    description: `Order ${order.orderNumber} - ${tenant.name}`,
  });

  return NextResponse.json({
    success: true,
    orderNumber: order.orderNumber,
    orderId: order.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceId: invoice.id,
    amount: Number(order.amount),
    currency: invoice.currency,
    checkoutUrl: session.checkoutUrl,
    gatewayProvider: session.provider,
  }, { status: 201 });
}
