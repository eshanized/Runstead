import type { PaymentGateway, CreateCheckoutSessionParams, CheckoutSessionResult, WebhookVerificationResult } from './types';

export class SandboxPaymentGateway implements PaymentGateway {
  name = 'sandbox';
  isLiveConfigured = false;

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    const sessionId = `test_sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const checkoutUrl = `${params.successUrl}?session_id=${sessionId}&test_mode=1`;

    return {
      provider: 'sandbox',
      sessionId,
      checkoutUrl,
    };
  }

  async verifyWebhook(rawPayload: string | Buffer, signatureHeader: string): Promise<WebhookVerificationResult> {
    if (signatureHeader === 'test_invalid_signature') {
      return { valid: false, error: 'Invalid test signature' };
    }

    try {
      const payloadString = typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf8');
      const event = JSON.parse(payloadString);

      return {
        valid: true,
        eventId: event.id || `test_evt_${Date.now()}`,
        eventType: event.type || 'checkout.session.completed',
        tenantId: event.data?.object?.metadata?.tenantId,
        orderId: event.data?.object?.metadata?.orderId,
        invoiceId: event.data?.object?.metadata?.invoiceId,
        amount: event.data?.object?.amount_total ? event.data.object.amount_total / 100 : 29.99,
        currency: event.data?.object?.currency?.toUpperCase() || 'USD',
        providerTransactionId: `test_txn_${Date.now()}`,
      };
    } catch {
      return { valid: false, error: 'Malformed JSON payload' };
    }
  }

  async refundPayment(transactionId: string): Promise<{ success: boolean; refundId?: string }> {
    return {
      success: true,
      refundId: `test_re_${Date.now()}`,
    };
  }
}
