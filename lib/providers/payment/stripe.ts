import crypto from 'node:crypto';
import { env } from '../../config/env.ts';
import type { PaymentGateway, CreateCheckoutSessionParams, CheckoutSessionResult, WebhookVerificationResult } from './types';

export class StripeGateway implements PaymentGateway {
  name = 'stripe';
  private secretKey?: string;
  private webhookSecret?: string;

  constructor(secretKey?: string, webhookSecret?: string) {
    this.secretKey = secretKey || env.STRIPE_SECRET_KEY;
    this.webhookSecret = webhookSecret || env.STRIPE_WEBHOOK_SECRET;
  }

  get isLiveConfigured(): boolean {
    return Boolean(this.secretKey && this.secretKey.startsWith('sk_'));
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    if (!this.secretKey) {
      throw new Error('Stripe is not configured: Missing STRIPE_SECRET_KEY. Please provide valid gateway credentials.');
    }

    const unitAmountCents = Math.round(params.amount * 100);
    const body = new URLSearchParams({
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': params.currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': params.description || `Hosting Order ${params.orderId}`,
      'line_items[0][price_data][unit_amount]': String(unitAmountCents),
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'success_url': params.successUrl,
      'cancel_url': params.cancelUrl,
      'customer_email': params.customerEmail,
      'client_reference_id': params.orderId,
      'metadata[tenantId]': params.tenantId,
      'metadata[orderId]': params.orderId,
      'metadata[invoiceId]': params.invoiceId,
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Stripe API checkout session creation failed (${response.status}): ${err}`);
    }

    const data = await response.json() as { id: string; url: string };
    return {
      provider: 'stripe',
      sessionId: data.id,
      checkoutUrl: data.url,
    };
  }

  /**
   * Verifies Stripe webhook signatures using HMAC-SHA256 with timestamp tolerance.
   * Prevents webhook forgery and replay attacks.
   */
  async verifyWebhook(rawPayload: string | Buffer, signatureHeader: string): Promise<WebhookVerificationResult> {
    if (!this.webhookSecret) {
      return {
        valid: false,
        error: 'Missing STRIPE_WEBHOOK_SECRET configuration on server.',
      };
    }

    if (!signatureHeader) {
      return {
        valid: false,
        error: 'Missing Stripe-Signature header.',
      };
    }

    const payloadString = typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf8');

    // Parse header: t=1614000000,v1=abc...,v0=...
    const signatureParts = signatureHeader.split(',').reduce<Record<string, string>>((acc, item) => {
      const [k, v] = item.trim().split('=');
      if (k && v) acc[k] = v;
      return acc;
    }, {});

    const timestamp = signatureParts.t;
    const expectedSignature = signatureParts.v1;

    if (!timestamp || !expectedSignature) {
      return {
        valid: false,
        error: 'Malformed Stripe-Signature header: missing timestamp or v1 signature.',
      };
    }

    // 5-minute replay attack tolerance window (300 seconds)
    const timestampNumber = parseInt(timestamp, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampNumber) > 300) {
      return {
        valid: false,
        error: 'Stripe webhook signature expired: timestamp exceeds 300s replay window.',
      };
    }

    // Compute expected HMAC-SHA256
    const signedPayload = `${timestamp}.${payloadString}`;
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const computedSignature = hmac.update(signedPayload).digest('hex');

    const computedBuffer = Buffer.from(computedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (computedBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Signature length mismatch' };
    }

    const isMatch = crypto.timingSafeEqual(computedBuffer, expectedBuffer);
    if (!isMatch) {
      return { valid: false, error: 'Cryptographic signature verification failed' };
    }

    try {
      const event = JSON.parse(payloadString);
      const session = event.data?.object;

      return {
        valid: true,
        eventId: event.id,
        eventType: event.type,
        tenantId: session?.metadata?.tenantId,
        orderId: session?.metadata?.orderId,
        invoiceId: session?.metadata?.invoiceId,
        amount: session?.amount_total ? session.amount_total / 100 : undefined,
        currency: session?.currency?.toUpperCase(),
        providerTransactionId: session?.payment_intent || session?.id,
      };
    } catch {
      return { valid: false, error: 'Failed to parse webhook JSON payload' };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<{ success: boolean; refundId?: string; error?: string }> {
    if (!this.secretKey) {
      return { success: false, error: 'Stripe is not configured' };
    }

    try {
      const body = new URLSearchParams({
        payment_intent: transactionId,
      });
      if (amount) {
        body.set('amount', String(Math.round(amount * 100)));
      }

      const response = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err };
      }

      const data = await response.json() as { id: string };
      return { success: true, refundId: data.id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
