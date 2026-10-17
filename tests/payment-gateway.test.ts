import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { StripeGateway } from '../lib/providers/payment/stripe.ts';
import { SandboxPaymentGateway } from '../lib/providers/payment/sandbox.ts';

describe('Payment Gateway & Webhook Reconciliation Suite', () => {
  const testWebhookSecret = 'whsec_test_secret_key_1234567890abcdef';
  const stripe = new StripeGateway('sk_test_123', testWebhookSecret);

  test('1. Stripe Signature Verification: validates authentic webhook payloads', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_abc',
          amount_total: 4999,
          currency: 'usd',
          metadata: {
            tenantId: '11111111-1111-1111-1111-111111111111',
            orderId: '22222222-2222-2222-2222-222222222222',
            invoiceId: '33333333-3333-3333-3333-333333333333',
          },
        },
      },
    });

    // Compute legitimate Stripe HMAC
    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', testWebhookSecret);
    const signature = hmac.update(signedPayload).digest('hex');

    const header = `t=${timestamp},v1=${signature}`;
    const result = await stripe.verifyWebhook(payload, header);

    assert.equal(result.valid, true);
    assert.equal(result.eventType, 'checkout.session.completed');
    assert.equal(result.orderId, '22222222-2222-2222-2222-222222222222');
    assert.equal(result.invoiceId, '33333333-3333-3333-3333-333333333333');
    assert.equal(result.amount, 49.99);
  });

  test('2. Replay Protection: rejects webhooks with timestamps outside 300s window', async () => {
    // 10 minutes old (600s)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const payload = JSON.stringify({ id: 'evt_replay', type: 'charge.succeeded' });

    const signedPayload = `${oldTimestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', testWebhookSecret);
    const signature = hmac.update(signedPayload).digest('hex');

    const header = `t=${oldTimestamp},v1=${signature}`;
    const result = await stripe.verifyWebhook(payload, header);

    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('300s replay window'), 'Must reject expired timestamp');
  });

  test('3. Tamper Prevention: rejects altered payload even with original signature', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const originalPayload = JSON.stringify({ amount: 100 });
    const tamperedPayload = JSON.stringify({ amount: 0 }); // Attacker changes amount

    const signedPayload = `${timestamp}.${originalPayload}`;
    const hmac = crypto.createHmac('sha256', testWebhookSecret);
    const signature = hmac.update(signedPayload).digest('hex');

    const header = `t=${timestamp},v1=${signature}`;
    const result = await stripe.verifyWebhook(tamperedPayload, header);

    assert.equal(result.valid, false);
  });

  test('4. Sandbox Gateway: creates test checkout session and verifies test webhook', async () => {
    const sandbox = new SandboxPaymentGateway();
    assert.equal(sandbox.name, 'sandbox');
    assert.equal(sandbox.isLiveConfigured, false);

    const session = await sandbox.createCheckoutSession({
      tenantId: 'tenant-1',
      orderId: 'ord-1',
      invoiceId: 'inv-1',
      amount: 29.99,
      currency: 'USD',
      customerEmail: 'alex@example.com',
      customerName: 'Alex',
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    });

    assert.ok(session.checkoutUrl.includes('test_mode=1'));
    assert.ok(session.sessionId.startsWith('test_sess_'));

    const webhookRes = await sandbox.verifyWebhook(
      JSON.stringify({ id: 'test_event', data: { object: { amount_total: 2999 } } }),
      'valid_test_signature'
    );
    assert.equal(webhookRes.valid, true);
    assert.equal(webhookRes.amount, 29.99);
  });
});
