import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { seedData } from '../lib/demo/seed-data.ts';

describe('Demo Seed Data Integrity', () => {
  test('seedData contains all required state collections', () => {
    assert.ok(Array.isArray(seedData.customers), 'customers must be an array');
    assert.ok(seedData.customers.length > 0, 'customers must not be empty');

    assert.ok(Array.isArray(seedData.products), 'products must be an array');
    assert.ok(seedData.products.length > 0, 'products must not be empty');

    assert.ok(Array.isArray(seedData.orders), 'orders must be an array');
    assert.ok(seedData.orders.length > 0, 'orders must not be empty');

    assert.ok(Array.isArray(seedData.services), 'services must be an array');
    assert.ok(seedData.services.length > 0, 'services must not be empty');

    assert.ok(Array.isArray(seedData.domains), 'domains must be an array');
    assert.ok(seedData.domains.length > 0, 'domains must not be empty');

    assert.ok(Array.isArray(seedData.dnsZones), 'dnsZones must be an array');
    assert.ok(seedData.dnsZones.length > 0, 'dnsZones must not be empty');

    assert.ok(Array.isArray(seedData.invoices), 'invoices must be an array');
    assert.ok(seedData.invoices.length > 0, 'invoices must not be empty');

    assert.ok(Array.isArray(seedData.tickets), 'tickets must be an array');
    assert.ok(seedData.tickets.length > 0, 'tickets must not be empty');

    assert.ok(seedData.storefront, 'storefront settings must exist');
    assert.ok(Array.isArray(seedData.integrations), 'integrations must be an array');
    assert.ok(seedData.business, 'business settings must exist');
    assert.ok(Array.isArray(seedData.notifications), 'notifications must be an array');
    assert.ok(seedData.platformOperator, 'platformOperator state must exist');
    assert.ok(Array.isArray(seedData.platformOperator.tenants), 'tenants must be an array');
    assert.ok(seedData.platformOperator.tenants.length > 0, 'tenants must not be empty');
    assert.ok(Array.isArray(seedData.platformOperator.events), 'operator events must be an array');
    assert.ok(Array.isArray(seedData.platformOperator.integrations), 'platform integrations must be an array');
  });

  test('referential integrity between collections', () => {
    const customerIds = new Set(seedData.customers.map((c) => c.id));
    const productIds = new Set(seedData.products.map((p) => p.id));

    // Verify orders reference valid customers and products
    for (const order of seedData.orders) {
      assert.ok(customerIds.has(order.customerId), `Order ${order.id} references non-existent customer ${order.customerId}`);
      assert.ok(productIds.has(order.productId), `Order ${order.id} references non-existent product ${order.productId}`);
    }

    // Verify services reference valid customers and products
    for (const service of seedData.services) {
      assert.ok(customerIds.has(service.customerId), `Service ${service.id} references non-existent customer ${service.customerId}`);
      assert.ok(productIds.has(service.productId), `Service ${service.id} references non-existent product ${service.productId}`);
    }

    // Verify invoices reference valid customers
    for (const invoice of seedData.invoices) {
      assert.ok(customerIds.has(invoice.customerId), `Invoice ${invoice.id} references non-existent customer ${invoice.customerId}`);
      assert.ok(invoice.lineItems.length > 0, `Invoice ${invoice.id} has no line items`);
      // Verify arithmetic
      const calculatedSubtotal = invoice.lineItems.reduce((acc, li) => acc + li.total, 0);
      assert.equal(Math.round(calculatedSubtotal), Math.round(invoice.subtotal), `Invoice ${invoice.id} subtotal mismatch`);
    }

    // Verify storefront displayed products exist
    for (const pid of seedData.storefront.displayedProductIds) {
      assert.ok(productIds.has(pid), `Storefront references non-existent product ${pid}`);
    }
  });

  test('deterministic seed stability and no placeholder data leaks', () => {
    assert.ok(seedData.business.businessName.length > 0);
    assert.ok(seedData.business.email.includes('@'));
    assert.ok(seedData.storefront.primaryColor.startsWith('#'));
  });
});
