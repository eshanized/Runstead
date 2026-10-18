import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { getInvoiceById } from '@/lib/services/invoice.service';
import { getPaymentGateway, PaymentGatewayUnavailableError } from '@/lib/providers/payment/factory';
import { recordAuditEvent } from '@/lib/services/audit.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  let customer;
  let user;
  try {
    const auth = await requireCustomer(tenantId, undefined, req);
    customer = auth.customer;
    user = auth.user;
  } catch (err: unknown) {
    const status = err instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status });
  }

  // Fetch invoice and ensure ownership in authorized tenant
  const invoice = await getInvoiceById(customer.tenantId, invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.customerId !== customer.id) {
    return NextResponse.json({ error: 'Forbidden: Invoice does not belong to your account' }, { status: 403 });
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({
      success: true,
      message: 'Invoice has already been settled.',
      invoice,
    });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional
  }

  const allowSandbox = Boolean(body.allowSandbox && process.env.NODE_ENV !== 'production');

  let gateway;
  try {
    gateway = getPaymentGateway({
      preferredProvider: body.provider || 'stripe',
      allowSandbox,
    });
  } catch (err: unknown) {
    if (err instanceof PaymentGatewayUnavailableError) {
      return NextResponse.json(
        { error: 'Payment processing is currently unavailable. Please contact billing support.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
  }

  const totalAmount = Number(invoice.totalAmount || invoice.total);

  try {
    const checkoutResult = await gateway.createCheckoutSession({
      tenantId: customer.tenantId,
      orderId: invoice.orderId || invoiceId,
      invoiceId,
      amount: totalAmount,
      currency: invoice.currency || 'USD',
      customerEmail: customer.email,
      customerName: customer.name,
      successUrl: `${url.origin}/client/invoices?status=success&invoice_id=${invoiceId}`,
      cancelUrl: `${url.origin}/client/invoices?status=cancelled&invoice_id=${invoiceId}`,
      description: `Invoice ${invoice.invoiceNumber || invoiceId}`,
    });

    await recordAuditEvent(customer.tenantId, {
      actorId: user.id,
      actorType: 'customer',
      action: 'payment.session_created',
      resourceType: 'invoice',
      resourceId: invoiceId,
      payload: {
        provider: checkoutResult.provider,
        amount: totalAmount,
        currency: invoice.currency,
      },
    });

    // Note: The invoice remains unpaid until a verified gateway webhook event confirms settlement
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      sessionId: checkoutResult.sessionId,
      provider: checkoutResult.provider,
      message: 'Checkout session created. Complete payment via provider to settle invoice.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout session initiation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
