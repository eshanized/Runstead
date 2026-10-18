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

  let gateway;
  try {
    gateway = getPaymentGateway('stripe');
  } catch {
    return NextResponse.json({ error: 'Stripe webhook processing is unavailable.' }, { status: 503 });
  }

  const verification = await gateway.verifyWebhook(rawBody, signature);
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error || 'Invalid webhook signature' }, { status: 400 });
  }

  // This checkout implementation supports settlement only from verified paid Checkout Sessions.
  // payment_intent.succeeded metadata is not guaranteed by our session creation contract.
  if (verification.eventType !== 'checkout.session.completed') {
    return NextResponse.json({
      received: true,
      ignored: true,
      eventType: verification.eventType,
    });
  }

  if (verification.paymentStatus !== 'paid') {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason: 'checkout_session_not_paid',
      eventId: verification.eventId,
    });
  }

  const { tenantId, invoiceId, amount, currency, providerTransactionId, eventId } = verification;
  if (
    !tenantId ||
    !invoiceId ||
    !eventId ||
    !providerTransactionId ||
    !currency ||
    amount === undefined ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return NextResponse.json({ error: 'Verified webhook is missing required settlement values.' }, { status: 400 });
  }

  try {
    const settlement = await settleInvoice(
      tenantId,
      invoiceId,
      {
        amount,
        currency,
        method: 'stripe',
        providerTransactionId,
        idempotencyKey: eventId,
        metadata: { eventType: verification.eventType, stripeEventId: eventId },
      },
      'webhook:stripe'
    );

    return NextResponse.json({
      received: true,
      invoiceId,
      alreadySettled: settlement.alreadySettled,
    });
  } catch {
    // Return 5xx for transient reconciliation/database failures so Stripe retries delivery.
    return NextResponse.json({ error: 'Payment settlement could not be reconciled. Please retry delivery.' }, { status: 500 });
  }
}
