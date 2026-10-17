export interface CreateCheckoutSessionParams {
  tenantId: string;
  orderId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
  description?: string;
}

export interface CheckoutSessionResult {
  provider: string;
  sessionId: string;
  checkoutUrl: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  eventId?: string;
  eventType?: string;
  tenantId?: string;
  invoiceId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  providerTransactionId?: string;
  error?: string;
}

export interface PaymentGateway {
  name: string;
  isLiveConfigured: boolean;
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyWebhook(rawPayload: string | Buffer, signatureHeader: string): Promise<WebhookVerificationResult>;
  refundPayment(transactionId: string, amount?: number): Promise<{ success: boolean; refundId?: string; error?: string }>;
}
