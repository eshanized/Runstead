import { NextResponse } from 'next/server';
import { requireCustomer, AuthenticationError } from '@/lib/auth/guards';
import { getInvoiceById, settleInvoice } from '@/lib/services/invoice.service';
import { getPaymentGateway } from '@/lib/providers/payment/factory';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || 'default';

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

  // Fetch invoice and ensure ownership
  const invoice = await getInvoiceById(customer.tenantId, invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.customerId !== customer.id && (invoice as any).customer_id !== customer.id) {
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

  const paymentMethod = body.method || 'card';
  const idempotencyKey = body.idempotencyKey || `pay_${invoiceId}_${Date.now()}`;

  // Process transaction through payment gateway provider
  const gateway = getPaymentGateway('sandbox');
  const totalAmount = Number(invoice.total);

  try {
    const checkoutResult = await gateway.createCheckoutSession({
      tenantId: customer.tenantId,
      orderId: (invoice as any).orderId || (invoice as any).order_id || invoiceId,
      invoiceId,
      amount: totalAmount,
      currency: invoice.currency || 'USD',
      customerEmail: customer.email,
      customerName: customer.name,
      successUrl: `${url.origin}/client/invoices`,
      cancelUrl: `${url.origin}/client/invoices`,
      description: `Invoice ${invoice.invoiceNumber || invoiceId}`,
    });

    // Settle invoice in database
    const settlement = await settleInvoice(
      customer.tenantId,
      invoiceId,
      {
        amount: totalAmount,
        currency: invoice.currency || 'USD',
        method: paymentMethod,
        providerTransactionId: checkoutResult.sessionId,
        idempotencyKey,
        metadata: { gateway: 'sandbox', customerName: customer.name },
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Payment settled successfully.',
      invoice: settlement.invoice,
      payment: settlement.payment,
      transactionId: checkoutResult.sessionId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment settlement failed' },
      { status: 500 }
    );
  }
}
