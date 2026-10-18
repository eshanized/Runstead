import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminPrisma, withTenantContext } from '@/lib/db/client';
import { getAuthenticatedUser } from '@/lib/auth/guards';
import { createOrder } from '@/lib/services/order.service';
import { getPaymentGateway } from '@/lib/providers/payment/factory';
import { checkRateLimitAsync, getRateLimitClientAddress } from '@/lib/security/rate-limit';
import { env } from '@/lib/config/env';

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

import { sanitizeRedirectUrl } from '@/lib/security/redirect';

export async function POST(req: Request) {
  const ip = getRateLimitClientAddress(req);
  const rateLimit = await checkRateLimitAsync(`checkout:${ip}`, { windowMs: 60_000, maxRequests: 10 });

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

  // 1. Resolve Tenant from PostgreSQL
  let tenant: { id: string; name: string; currency: string } | null = null;
  try {
    tenant = await adminPrisma.tenant.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
      select: { id: true, name: true, currency: true },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Storefront service unavailable' }, { status: 503 });
  }

  if (!tenant) {
    return NextResponse.json({ error: 'Reseller storefront tenant not found' }, { status: 404 });
  }

  // 2. Identify or Create Customer securely (prevent account hijacking)
  const authUser = await getAuthenticatedUser(req);
  const normalizedEmail = customerInput.email.toLowerCase().trim();
  const canLinkAuthenticatedUser = Boolean(
    authUser?.emailVerified &&
    authUser.email.toLowerCase().trim() === normalizedEmail
  );

  let customer: { id: string; name: string; email: string; userId?: string | null } | null = null;
  try {
    const existingCustomer = await withTenantContext(tenant.id, (tx) => tx.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: normalizedEmail,
      },
    }));

    if (existingCustomer?.userId) {
      // Existing customer identities can only use their own verified account.
      if (!canLinkAuthenticatedUser || authUser?.id !== existingCustomer.userId) {
        return NextResponse.json(
          { error: 'This email belongs to an existing customer profile. Sign in with the verified account for that email or use a different checkout email.' },
          { status: 403 }
        );
      }
      customer = existingCustomer;
    } else if (existingCustomer) {
      // Never claim an unlinked customer profile with an unverified or mismatched email.
      if (!canLinkAuthenticatedUser || !authUser) {
        return NextResponse.json(
          { error: 'This email already has a customer profile. Sign in with a verified account for that email before using this profile.' },
          { status: 403 }
        );
      }
      customer = await withTenantContext(tenant.id, (tx) => tx.customer.update({
        where: { tenantId_id: { tenantId: tenant.id, id: existingCustomer.id } },
        data: { userId: authUser.id },
        select: { id: true, name: true, email: true, userId: true },
      }));
    } else {
      customer = await withTenantContext(tenant.id, (tx) => tx.customer.create({
        data: {
          tenantId: tenant.id,
          name: customerInput.name,
          email: normalizedEmail,
          company: customerInput.company,
          country: customerInput.country || 'US',
          phone: customerInput.phone,
          userId: canLinkAuthenticatedUser ? authUser!.id : undefined,
        },
        select: { id: true, name: true, email: true, userId: true },
      }));
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: `Customer profile error: ${msg}` }, { status: 500 });
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

  // 4. Validate redirect URLs against configured application origins
  const safeSuccessUrl = sanitizeRedirectUrl(
    successUrl,
    req.url,
    `/client/invoices?order_id=${order.id}&invoice_id=${invoice.id}`
  );
  const safeCancelUrl = sanitizeRedirectUrl(
    cancelUrl,
    req.url,
    `/client/invoices`
  );

  // 5. Create Payment Gateway Session
  const gateway = getPaymentGateway();
  try {
    const session = await gateway.createCheckoutSession({
      tenantId: tenant.id,
      orderId: order.id,
      invoiceId: invoice.id,
      amount: Number(order.amount),
      currency: tenant.currency || 'USD',
      customerEmail: customer.email,
      customerName: customer.name,
      successUrl: safeSuccessUrl,
      cancelUrl: safeCancelUrl,
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment session failed';
    return NextResponse.json({
      success: false,
      orderNumber: order.orderNumber,
      orderId: order.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: invoice.id,
      amount: Number(order.amount),
      currency: invoice.currency,
      checkoutUrl: null,
      paymentError: 'Checkout session could not be created. No payment was taken; retry or contact billing support.',
    }, { status: 503 });
  }
}
