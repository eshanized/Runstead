import { StripeGateway } from './stripe.ts';
import { SandboxPaymentGateway } from './sandbox.ts';
import type { PaymentGateway } from './types.ts';
import { env } from '../../config/env.ts';

/**
 * Payment gateway factory.
 * Returns the live Stripe gateway if credentials are configured in the environment,
 * or safely falls back to the deterministic sandbox gateway.
 */
export function getPaymentGateway(preferredProvider: string = 'stripe'): PaymentGateway {
  if (preferredProvider === 'stripe' && env.STRIPE_SECRET_KEY) {
    return new StripeGateway();
  }

  return new SandboxPaymentGateway();
}
