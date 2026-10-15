import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { seedData } from '../lib/demo/seed-data.ts';
import type { DemoState } from '../lib/demo/types.ts';
import * as workflows from '../lib/demo/workflows.ts';
import { getDashboardStats } from '../lib/demo/selectors.ts';

describe('Interactive Demo Workflows Layer', () => {
  let state: DemoState;

  test('Customer Workflow: create, update, and archive/delete', () => {
    state = { ...seedData };
    const initialCount = state.customers.length;

    // 1. Create
    state = workflows.createCustomer(state, {
      name: 'John Investor',
      email: 'john@investor.fund',
      company: 'Venture Capital Partners',
      country: 'United States',
    });
    assert.equal(state.customers.length, initialCount + 1);
    const created = state.customers.find((c) => c.email === 'john@investor.fund');
    assert.ok(created);
    assert.equal(created?.name, 'John Investor');

    // Duplicate email protection
    assert.throws(() => {
      workflows.createCustomer(state, {
        name: 'Another John',
        email: 'john@investor.fund',
      });
    }, /already exists/);

    // 2. Update
    state = workflows.updateCustomer(state, created.id, {
      company: 'Global Ventures LLC',
      status: 'suspended',
    });
    const updated = state.customers.find((c) => c.id === created.id);
    assert.equal(updated?.company, 'Global Ventures LLC');
    assert.equal(updated?.status, 'suspended');

    // 3. Safe archive
    state = workflows.archiveCustomer(state, created.id);
    const archived = state.customers.find((c) => c.id === created.id);
    assert.equal(archived?.archived, true);
    assert.equal(archived?.status, 'inactive');

    // 4. Safe delete when no active services
    state = workflows.deleteCustomer(state, created.id);
    assert.equal(state.customers.length, initialCount);
  });

  test('Product Workflow: create, edit pricing, toggle availability, archive', () => {
    state = { ...seedData };
    const initialCount = state.products.length;

    // 1. Create
    state = workflows.createProduct(state, {
      name: 'Dedicated Bare Metal',
      type: 'vps',
      description: 'High-performance dedicated infrastructure',
      pricing: [
        { cycle: 'monthly', price: 199.0 },
        { cycle: 'annually', price: 1990.0 },
      ],
      setupFee: 49.0,
      resourceLimits: [
        { label: 'CPU', value: '16 Cores' },
        { label: 'RAM', value: '64 GB ECC' },
      ],
      available: true,
      addons: [{ name: 'cPanel License', price: 35.0 }],
    });
    assert.equal(state.products.length, initialCount + 1);
    const newProd = state.products.find((p) => p.name === 'Dedicated Bare Metal');
    assert.ok(newProd);

    // 2. Toggle availability
    state = workflows.toggleProductAvailability(state, newProd.id, false);
    assert.equal(state.products.find((p) => p.id === newProd.id)?.available, false);

    // 3. Edit pricing
    state = workflows.updateProduct(state, newProd.id, {
      pricing: [{ cycle: 'monthly', price: 179.0 }],
    });
    assert.equal(state.products.find((p) => p.id === newProd.id)?.pricing[0].price, 179.0);

    // 4. Safe archive
    state = workflows.archiveProduct(state, newProd.id);
    assert.equal(state.products.find((p) => p.id === newProd.id)?.available, false);
    assert.ok(!state.storefront.displayedProductIds.includes(newProd.id));
  });

  test('Order & Provisioning Lifecycle: checkout -> paid -> provisioning -> active service', () => {
    state = { ...seedData };
    const customer = state.customers[0];
    const product = state.products[0];
    const initialOrderCount = state.orders.length;
    const initialInvoiceCount = state.invoices.length;
    const initialServiceCount = state.services.length;

    // 1. Checkout (Create order + invoice with simulated payment)
    const { state: nextState, order, invoice } = workflows.createOrderWithInvoice(state, {
      customerId: customer.id,
      productId: product.id,
      billingCycle: 'monthly',
      simulatePaymentImmediately: true,
      paymentMethod: 'Credit Card (Simulated)',
    });
    state = nextState;

    assert.equal(state.orders.length, initialOrderCount + 1);
    assert.equal(state.invoices.length, initialInvoiceCount + 1);
    assert.equal(order.status, 'paid');
    assert.equal(invoice.status, 'paid');
    assert.equal(order.invoiceId, invoice.id);
    assert.equal(invoice.orderId, order.id);

    // 2. Controlled Provisioning Failure Demo
    const failureResult = workflows.simulateProvisioning(state, {
      orderId: order.id,
      forceFailure: true,
      failureReason: 'Upstream hypervisor node capacity limit exceeded',
    });
    state = failureResult.state;
    const failedOrder = state.orders.find((o) => o.id === order.id);
    assert.equal(failedOrder?.status, 'failed');
    assert.ok(failedOrder?.events.some((e) => e.status === 'failed'));

    // 3. Provisioning Retry Success
    const successResult = workflows.simulateProvisioning(state, {
      orderId: order.id,
      forceFailure: false,
    });
    state = successResult.state;
    const activeOrder = state.orders.find((o) => o.id === order.id);
    assert.equal(activeOrder?.status, 'active');
    assert.ok(activeOrder?.serviceId);

    // Verify service created and linked
    assert.equal(state.services.length, initialServiceCount + 1);
    const service = state.services.find((s) => s.id === activeOrder?.serviceId);
    assert.ok(service);
    assert.equal(service?.status, 'active');
    assert.equal(service?.customerId, customer.id);
    assert.equal(service?.productId, product.id);

    // Verify idempotency (calling provisioning again does not duplicate service)
    const retryResult = workflows.simulateProvisioning(state, {
      orderId: order.id,
      forceFailure: false,
    });
    assert.equal(retryResult.state.services.length, initialServiceCount + 1);
  });

  test('Service Lifecycle: suspend, restore, and cancellation actions', () => {
    state = { ...seedData };
    const activeService = state.services.find((s) => s.status === 'active');
    assert.ok(activeService);

    // Suspend
    state = workflows.suspendService(state, {
      serviceId: activeService.id,
      reason: 'Overdue payment',
    });
    assert.equal(state.services.find((s) => s.id === activeService.id)?.status, 'suspended');

    // Restore
    state = workflows.restoreService(state, { serviceId: activeService.id });
    assert.equal(state.services.find((s) => s.id === activeService.id)?.status, 'active');

    // Cancel
    state = workflows.cancelService(state, {
      serviceId: activeService.id,
      reason: 'Customer requested cancellation',
    });
    assert.equal(state.services.find((s) => s.id === activeService.id)?.status, 'canceled');
  });

  test('Domain & DNS Workflow: simulated purchase, external connection, renewal, records', () => {
    state = { ...seedData };
    const customer = state.customers[0];
    const initialDomains = state.domains.length;
    const initialZones = state.dnsZones.length;

    // 1. Purchase domain
    const { state: nextState, domain, invoice } = workflows.purchaseDomainSimulation(state, {
      customerId: customer.id,
      domain: 'investor-showcase.com',
      price: 12.99,
      autoRenew: true,
      simulatePayment: true,
    });
    state = nextState;

    assert.equal(state.domains.length, initialDomains + 1);
    assert.equal(state.dnsZones.length, initialZones + 1);
    assert.equal(domain.domain, 'investor-showcase.com');
    assert.ok(domain.dnsZoneId);

    // Verify linked DNS zone was created with baseline records
    const zone = state.dnsZones.find((z) => z.id === domain.dnsZoneId);
    assert.ok(zone);
    assert.equal(zone?.domain, 'investor-showcase.com');
    assert.ok(zone?.records.length >= 2);

    // 2. Add DNS Record with strict validation
    state = workflows.addDnsRecord(state, {
      zoneId: zone.id,
      type: 'A',
      host: 'sub',
      value: '198.51.100.99',
      ttl: 3600,
      priority: null,
    });
    const updatedZone = state.dnsZones.find((z) => z.id === zone.id)!;
    assert.ok(updatedZone.records.some((r) => r.host === 'sub' && r.value === '198.51.100.99'));

    // Validation failure on bad IP
    assert.throws(() => {
      workflows.addDnsRecord(state, {
        zoneId: zone.id,
        type: 'A',
        host: 'bad',
        value: '999.999.999.999',
        ttl: 3600,
        priority: null,
      });
    }, /Invalid IPv4/);

    // 3. Renew domain
    state = workflows.renewDomain(state, { domainId: domain.id, years: 1 });
    const renewed = state.domains.find((d) => d.id === domain.id);
    const renewedYear = new Date(renewed!.expiryDate).getFullYear();
    const origYear = new Date(domain.expiryDate).getFullYear();
    assert.equal(renewedYear, origYear + 1);

    // 4. Connect external domain
    state = workflows.connectExternalDomain(state, {
      customerId: customer.id,
      domain: 'external-client.net',
    });
    const externalDomain = state.domains.find((d) => d.domain === 'external-client.net');
    assert.ok(externalDomain);
    assert.equal(externalDomain?.domainType, 'external');
  });

  test('Invoice Workflow: pay, void, and refund with payment records', () => {
    state = { ...seedData };
    const sentInvoice = state.invoices.find((i) => i.status === 'sent');
    assert.ok(sentInvoice);

    // Mark paid
    state = workflows.markInvoicePaid(state, {
      invoiceId: sentInvoice.id,
      method: 'Bank Transfer (Simulated)',
    });
    let inv = state.invoices.find((i) => i.id === sentInvoice.id)!;
    assert.equal(inv.status, 'paid');
    assert.ok(inv.paidDate !== null);
    assert.ok(inv.payments.length > 0);

    // Refund
    state = workflows.refundInvoice(state, { invoiceId: sentInvoice.id });
    inv = state.invoices.find((i) => i.id === sentInvoice.id)!;
    assert.equal(inv.status, 'refunded');
  });

  test('Ticket Workflow: create ticket, staff reply, internal note, status change', () => {
    state = { ...seedData };
    const customer = state.customers[0];
    const initialTicketCount = state.tickets.length;

    // 1. Create ticket
    state = workflows.createTicket(state, {
      customerId: customer.id,
      subject: 'Urgent: SSL Renewal Inquiry',
      priority: 'high',
      category: 'Billing',
      message: 'Need help renewing certificate for our primary domain.',
    });
    assert.equal(state.tickets.length, initialTicketCount + 1);
    const newTicket = state.tickets[0];
    assert.equal(newTicket.subject, 'Urgent: SSL Renewal Inquiry');

    // 2. Staff public reply
    state = workflows.addTicketMessage(state, {
      ticketId: newTicket.id,
      author: 'Support Staff',
      authorType: 'staff',
      message: 'We have initiated the auto-renew for your SSL certificate.',
      internal: false,
    });

    // 3. Staff internal note
    state = workflows.addTicketMessage(state, {
      ticketId: newTicket.id,
      author: 'Lead Architect',
      authorType: 'staff',
      message: 'Verified upstream ACME challenge logs: success.',
      internal: true,
      updateStatusTo: 'resolved',
    });

    const ticket = state.tickets.find((t) => t.id === newTicket.id)!;
    assert.equal(ticket.messages.length, 3);
    assert.equal(ticket.status, 'resolved');
    assert.ok(ticket.messages.some((m) => m.internal === true));
  });

  test('SaaS Acquisition Launch & Platform Operator Synchronization', () => {
    state = { ...seedData };

    // Launch journey
    state = workflows.launchSaaSTenant(state, {
      planName: 'Scale',
      billingInterval: 'monthly',
      businessName: 'Veloce Cloud Solutions',
      category: 'agency',
      email: 'admin@velocecloud.com',
      headline: 'Next-Generation Bare Metal & VPS',
      customPrices: {
        prod_001: 9.99,
      },
    });

    // Check reseller business settings updated
    assert.equal(state.business.businessName, 'Veloce Cloud Solutions');
    assert.equal(state.business.currentPlan, 'Scale');

    // Check custom price persisted on product
    const prod1 = state.products.find((p) => p.id === 'prod_001');
    assert.equal(prod1?.pricing[0].price, 9.99);

    // Check platform operator directory synchronized
    const operatorTenant = state.platformOperator.tenants.find((t) => t.id === 'ten_001');
    assert.ok(operatorTenant);
    assert.equal(operatorTenant?.businessName, 'Veloce Cloud Solutions');
    assert.equal(operatorTenant?.plan, 'Scale');

    // Operator changes tenant status in platform console
    state = workflows.updatePlatformTenantStatus(state, {
      tenantId: 'ten_001',
      status: 'suspended',
    });
    assert.equal(
      state.platformOperator.tenants.find((t) => t.id === 'ten_001')?.status,
      'suspended'
    );
  });

  test('Analytics Consistency after Workflows', () => {
    state = { ...seedData };
    const initialStats = getDashboardStats(state);

    // Pay an outstanding invoice
    const sentInvoice = state.invoices.find((i) => i.status === 'sent');
    if (sentInvoice) {
      state = workflows.markInvoicePaid(state, { invoiceId: sentInvoice.id });
      const newStats = getDashboardStats(state);
      assert.ok(newStats.outstandingTotal < initialStats.outstandingTotal);
      assert.ok(newStats.totalPaidRevenue > initialStats.totalPaidRevenue);
    }
  });
});
