import { NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/providers/payment/factory';
import { settleInvoice } from '@/lib/services/invoice.service';

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request payload' }, { status: 400 });
  }

  const gateway = getPaymentGateway('stripe');
  const verification = await gateway.verifyWebhook(rawBody, signature);

  if (!verification.valid) {
    return NextResponse.json({ error: verification.error || 'Invalid webhook signature' }, { status: 400 });
  }

  // Handle invoice settlement on completed checkout session or payment intent
  if (
    verification.eventType === 'checkout.session.completed' ||
    verification.eventType === 'payment_intent.succeeded'
  ) {
    const { tenantId, invoiceId, amount, currency, providerTransactionId, eventId } = verification;

    if (!tenantId || !invoiceId || amount === undefined) {
      return NextResponse.json({ error: 'Webhook payload missing required settlement metadata' }, { status: 400 });
    }

    try {
      const settlement = await settleInvoice(
        tenantId,
        invoiceId,
        {
          amount,
          currency: currency || 'USD',
          method: 'stripe',
          providerTransactionId,
          idempotencyKey: eventId,
          metadata: { eventType: verification.eventType },
        },
        'webhook:stripe'
      );

      return NextResponse.json({
        received: true,
        invoiceId,
        alreadySettled: settlement.alreadySettled,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Settlement failed: ${msg}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true, ignored: true, eventType: verification.eventType });
}
