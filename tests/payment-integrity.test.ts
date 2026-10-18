import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/db/client.ts';
import { createCustomer } from '../lib/services/customer.service.ts';
import { createProduct } from '../lib/services/product.service.ts';
import { createOrder } from '../lib/services/order.service.ts';
import { settleInvoice, getInvoiceById } from '../lib/services/invoice.service.ts';
import { getPaymentGateway } from '../lib/providers/payment/factory.ts';

describe('Payment Integrity & Financial Settlement Regression Suite', () => {
  const tenantId = 'e0000000-0000-0000-0000-000000000001';

  test('1. Amount Mismatch: invoice settlement with incorrect amount must fail closed', async () => {
    const cust = await createCustomer(tenantId, {
      name: 'Payment Amount Test Customer',
      email: `payment_amount_${Date.now()}@test.org`,
    });

    const prod = await createProduct(tenantId, {
      name: 'Integrity Product A',
      type: 'shared',
      description: 'Test product for payment integrity',
      pricing: [{ cycle: 'monthly', price: 20.00 }],
    });

    const orderResult = await createOrder(tenantId, cust.id, [
      { productId: prod.id, cycle: 'monthly', quantity: 1 },
    ]);

    const invoice = orderResult.invoice;
    const invoiceTotal = Number(invoice.totalAmount);

    // Attempt settlement with underpayment
    await assert.rejects(
      async () => {
        await settleInvoice(tenantId, invoice.id, {
          amount: invoiceTotal - 5.00,
          currency: invoice.currency,
          method: 'stripe',
          providerTransactionId: `tx_underpay_${Date.now()}`,
        });
      },
      /Payment amount mismatch/,
      'Underpayment must be strictly rejected'
    );

    // Attempt settlement with overpayment
    await assert.rejects(
      async () => {
        await settleInvoice(tenantId, invoice.id, {
          amount: invoiceTotal + 10.00,
          currency: invoice.currency,
          method: 'stripe',
          providerTransactionId: `tx_overpay_${Date.now()}`,
        });
      },
      /Payment amount mismatch/,
      'Overpayment without exact match must be strictly rejected'
    );
  });

  test('2. Currency Mismatch: invoice settlement with wrong currency must fail closed', async () => {
    const cust = await createCustomer(tenantId, {
      name: 'Currency Test Customer',
      email: `currency_test_${Date.now()}@test.org`,
    });

    const prod = await createProduct(tenantId, {
      name: 'Integrity Product B',
      type: 'shared',
      description: 'Test product for currency check',
      pricing: [{ cycle: 'monthly', price: 30.00 }],
    });

    const orderResult = await createOrder(tenantId, cust.id, [
      { productId: prod.id, cycle: 'monthly', quantity: 1 },
    ]);

    const invoice = orderResult.invoice;
    const invoiceTotal = Number(invoice.totalAmount);

    // Attempt settlement with wrong currency (e.g. EUR for USD invoice)
    await assert.rejects(
      async () => {
        await settleInvoice(tenantId, invoice.id, {
          amount: invoiceTotal,
          currency: 'EUR',
          method: 'stripe',
          providerTransactionId: `tx_curr_mismatch_${Date.now()}`,
        });
      },
      /Payment currency mismatch/,
      'Currency mismatch must be rejected'
    );
  });

  test('3. Idempotency & Duplicate Webhook Replay Protection', async () => {
    const cust = await createCustomer(tenantId, {
      name: 'Idempotency Test Customer',
      email: `idem_test_${Date.now()}@test.org`,
    });

    const prod = await createProduct(tenantId, {
      name: 'Integrity Product C',
      type: 'shared',
      description: 'Test product for idempotency',
      pricing: [{ cycle: 'monthly', price: 15.00 }],
    });

    const orderResult = await createOrder(tenantId, cust.id, [
      { productId: prod.id, cycle: 'monthly', quantity: 1 },
    ]);

    const invoice = orderResult.invoice;
    const invoiceTotal = Number(invoice.totalAmount);
    const idempotencyKey = `idem_key_${Date.now()}_unique`;
    const providerTxId = `ch_stripe_${Date.now()}`;

    // 1. First settlement
    const firstSettlement = await settleInvoice(tenantId, invoice.id, {
      amount: invoiceTotal,
      currency: invoice.currency,
      method: 'stripe',
      providerTransactionId: providerTxId,
      idempotencyKey,
    });

    assert.equal(firstSettlement.alreadySettled, false);
    assert.equal(firstSettlement.invoice.status, 'paid');

    // Fetch customer revenue after first settlement
    const customerAfterFirst = await prisma.customer.findUnique({
      where: { tenantId_id: { tenantId, id: cust.id } },
    });
    const firstRevenue = Number(customerAfterFirst?.totalRevenue || 0);

    // Count payments recorded
    const paymentsCountFirst = await prisma.payment.count({
      where: { tenantId, invoiceId: invoice.id },
    });
    assert.equal(paymentsCountFirst, 1);

    // 2. Replay duplicate settlement with same idempotency key
    const replaySettlement = await settleInvoice(tenantId, invoice.id, {
      amount: invoiceTotal,
      currency: invoice.currency,
      method: 'stripe',
      providerTransactionId: providerTxId,
      idempotencyKey,
    });

    assert.equal(replaySettlement.alreadySettled, true);

    // Verify revenue was NOT double counted
    const customerAfterReplay = await prisma.customer.findUnique({
      where: { tenantId_id: { tenantId, id: cust.id } },
    });
    assert.equal(Number(customerAfterReplay?.totalRevenue || 0), firstRevenue, 'Revenue must not increment on duplicate settlement');

    // Verify no duplicate payment record created
    const paymentsCountSecond = await prisma.payment.count({
      where: { tenantId, invoiceId: invoice.id },
    });
    assert.equal(paymentsCountSecond, 1, 'Payment records must remain exactly 1 after duplicate webhook call');
  });

  test('4. Production sandbox gateway restriction: sandbox barred in production', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      assert.throws(
        () => {
          getPaymentGateway();
        },
        /PaymentGatewayUnavailableError|Stripe credentials/,
        'Sandbox gateway must never be silently returned in production'
      );
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });
});
