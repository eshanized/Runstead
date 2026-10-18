import { StripeGateway } from './stripe.ts';
import { SandboxPaymentGateway } from './sandbox.ts';
import type { PaymentGateway } from './types.ts';
import { env } from '../../config/env.ts';

export class PaymentGatewayUnavailableError extends Error {
  constructor(message = 'Payment gateway is not configured for live transactions.') {
    super(message);
    this.name = 'PaymentGatewayUnavailableError';
  }
}

/**
 * Payment gateway factory.
 * Resolves the payment gateway based on environment and explicit request.
 * Sandbox is strictly restricted to test/demo contexts and will never settle production invoices.
 */
export function getPaymentGateway(
  options: { preferredProvider?: string; allowSandbox?: boolean } | string = 'stripe'
): PaymentGateway {
  const preferred = typeof options === 'string' ? options : (options.preferredProvider || 'stripe');
  const allowSandbox = typeof options === 'string' ? false : Boolean(options.allowSandbox);

  if (allowSandbox && (process.env.NODE_ENV === 'test' || env.NEXT_PUBLIC_ENABLE_DEMO === 'true')) {
    return new SandboxPaymentGateway();
  }

  if (preferred === 'stripe') {
    if (env.STRIPE_SECRET_KEY) {
      return new StripeGateway();
    }
    // In production or live mode, if Stripe is requested but unconfigured, do not fall back to sandbox
    if (process.env.NODE_ENV === 'production') {
      throw new PaymentGatewayUnavailableError('Stripe credentials (STRIPE_SECRET_KEY) are not configured.');
    }
  }

  // Non-production test environment fallback
  if (process.env.NODE_ENV === 'test') {
    return new SandboxPaymentGateway();
  }

  throw new PaymentGatewayUnavailableError('No live payment gateway is currently configured.');
}
