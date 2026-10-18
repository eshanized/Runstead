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

    // Stripe can include multiple v1 signatures during secret rotation; accept any valid v1.
    const parts = signatureHeader.split(',').map((part) => part.trim().split('=', 2));
    const timestamp = parts.find(([key]) => key === 't')?.[1];
    const signatures = parts.filter(([key, value]) => key === 'v1' && Boolean(value)).map(([, value]) => value!);

    if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) {
      return { valid: false, error: 'Malformed Stripe-Signature header.' };
    }

    const timestampNumber = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(timestampNumber) || Math.abs(nowSeconds - timestampNumber) > 300) {
      return { valid: false, error: 'Stripe webhook timestamp is outside the five-minute tolerance window.' };
    }

    const signedPayload = `${timestamp}.${payloadString}`;
    const computed = crypto.createHmac('sha256', this.webhookSecret).update(signedPayload).digest();
    const signatureValid = signatures.some((signature) => {
      if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
      const candidate = Buffer.from(signature, 'hex');
      return candidate.length === computed.length && crypto.timingSafeEqual(computed, candidate);
    });
    if (!signatureValid) {
      return { valid: false, error: 'Cryptographic Stripe signature verification failed.' };
    }

    try {
      const event = JSON.parse(payloadString) as {
        id?: unknown;
        type?: unknown;
        data?: { object?: Record<string, unknown> };
      };
      const object = event.data?.object;
      if (
        typeof event.id !== 'string' ||
        !event.id ||
        typeof event.type !== 'string' ||
        !event.type ||
        !object ||
        typeof object !== 'object'
      ) {
        return { valid: false, error: 'Signed Stripe event is missing required event fields.' };
      }

      const metadata = object.metadata && typeof object.metadata === 'object'
        ? object.metadata as Record<string, unknown>
        : {};
      const amountTotal = typeof object.amount_total === 'number' ? object.amount_total : undefined;
      const currency = typeof object.currency === 'string' ? object.currency.toUpperCase() : undefined;
      const paymentIntent = typeof object.payment_intent === 'string' ? object.payment_intent : undefined;
      const objectId = typeof object.id === 'string' ? object.id : undefined;

      return {
        valid: true,
        eventId: event.id,
        eventType: event.type,
        tenantId: typeof metadata.tenantId === 'string' ? metadata.tenantId : undefined,
        orderId: typeof metadata.orderId === 'string' ? metadata.orderId : undefined,
        invoiceId: typeof metadata.invoiceId === 'string' ? metadata.invoiceId : undefined,
        amount: amountTotal !== undefined ? amountTotal / 100 : undefined,
        currency,
        paymentStatus: typeof object.payment_status === 'string' ? object.payment_status : undefined,
        providerTransactionId: paymentIntent || objectId,
      };
    } catch {
      return { valid: false, error: 'Signed Stripe payload is not valid JSON.' };
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
