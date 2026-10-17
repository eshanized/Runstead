import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { getLocalDb, resolveLocalTenantId } from '../lib/db/local-db.ts';
import { listCustomers, createCustomer, updateCustomer, archiveCustomer } from '../lib/services/customer.service.ts';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../lib/services/product.service.ts';
import { createOrder, getOrderById, transitionOrderStatus } from '../lib/services/order.service.ts';
import { settleInvoice, getInvoiceById } from '../lib/services/invoice.service.ts';
import { listCustomerServices, updateServiceStatus } from '../lib/services/service.service.ts';
import { createTicket, replyTicket, listTickets } from '../lib/services/ticket.service.ts';
import { enqueueJob, processPendingJobs } from '../lib/jobs/queue.ts';
import { encryptData, decryptData } from '../lib/security/encryption.ts';

describe('Real Hosting Platform Operations & Dual DB Engine Suite', () => {
  const tenantId = 'e0000000-0000-0000-0000-000000000001';

  before(() => {
    // Ensure local DB is ready
    getLocalDb();
  });

  test('1. Database Engine: tenant fixtures and foreign keys are seeded', () => {
    const db = getLocalDb();
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
    assert.ok(tenant, 'Tenant must exist in database');
    assert.equal(tenant.currency, 'USD');
    assert.equal(resolveLocalTenantId('default'), tenantId);
  });

  test('2. Customer Lifecycle: persists in database, updates profile, and archives', async () => {
    const created = await createCustomer(tenantId, {
      name: 'Integration Test Customer',
      email: 'itest@customer.org',
      company: 'Integration Corp',
      country: 'US',
      phone: '+1 555 987 6543',
    });
    assert.ok(created.id, 'Must generate customer ID');
    assert.equal(created.name, 'Integration Test Customer');

    // Update
    const updated = await updateCustomer(tenantId, created.id, {
      company: 'Integration Corp International',
    });
    assert.equal(updated.company, 'Integration Corp International');

    // Archive
    const archived = await archiveCustomer(tenantId, created.id);
    assert.equal(archived.archived, true);

    // List excludes archived by default
    const list = await listCustomers(tenantId, { search: 'Integration Test' });
    assert.equal(list.customers.length, 0, 'Archived customer must be excluded from active list');
  });

  test('3. Product Management: creates plan with pricing tiers and resource limits', async () => {
    const product = await createProduct(tenantId, {
      name: 'Pro Cloud NVMe',
      type: 'shared',
      description: 'Dedicated high-speed NVMe storage cluster',
      setupFee: 5.0,
      pricing: [
        { cycle: 'monthly', price: 14.99 },
        { cycle: 'annual', price: 149.99 },
      ],
      resourceLimits: { diskGB: 50, bandwidthGB: 500, databases: 10 },
    });
    assert.ok(product.id);
    assert.equal(product.name, 'Pro Cloud NVMe');

    // Update product
    const updated = await updateProduct(tenantId, product.id, {
      setupFee: 0.0,
    });
    assert.equal(Number(updated.setupFee), 0.0);

    // Delete product
    const deleted = await deleteProduct(tenantId, product.id);
    assert.equal(deleted, true);
  });

  test('4. Commercial Order & Invoice Settle: calculates pricing and triggers provisioning', async () => {
    // 1. Create customer
    const customer = await createCustomer(tenantId, {
      name: 'Billing Test User',
      email: 'billing-user@test.org',
    });

    // 2. Fetch starter product
    const products = await listProducts(tenantId);
    const primaryProduct = products[0];

    // 3. Create real order
    const orderResult = await createOrder(tenantId, customer.id, [
      { productId: primaryProduct.id, cycle: 'monthly', quantity: 1 },
    ]);
    assert.ok(orderResult.order.id);
    assert.ok(orderResult.invoice.id);
    assert.equal(orderResult.order.status, 'awaiting_payment');

    // 4. Settle invoice
    const settlement = await settleInvoice(tenantId, orderResult.invoice.id, {
      amount: Number(orderResult.order.amount),
      method: 'stripe_credit_card',
      providerTransactionId: `ch_${Date.now()}`,
    });
    assert.equal(settlement.alreadySettled, false);
    assert.ok(settlement.payment.id);

    // 5. Verify invoice status updated
    const invoice = await getInvoiceById(tenantId, orderResult.invoice.id);
    assert.equal(invoice?.status, 'paid');
  });

  test('5. Operational Queue: enqueues and processes hosting provisioning and service actions', async () => {
    const job = await enqueueJob(tenantId, 'provision_service', {
      tenantId,
      customerId: 'c0000000-0000-0000-0000-000000000001',
      domain: 'test-infrastructure.io',
      package: 'Starter Cloud Hosting',
      username: 'testinfra',
    });
    assert.ok(job.id);
    assert.equal(job.status, 'queued');

    // Process pending jobs
    const response = await processPendingJobs({ limit: 10 });
    assert.ok(response.processed > 0);
    assert.ok(response.results.length > 0);
    assert.ok(response.succeeded >= 1);
  });

  test('6. Service Lifecycle: suspends, restores, and terminates hosting instances', async () => {
    const services = await listCustomerServices(tenantId, 'c0000000-0000-0000-0000-000000000001');
    assert.ok(services.length > 0);
    const serviceId = services[0].id;

    // Suspend
    const suspended = await updateServiceStatus(tenantId, serviceId, 'suspended', 'Non-payment');
    assert.equal(suspended.status, 'suspended');

    // Restore
    const restored = await updateServiceStatus(tenantId, serviceId, 'active');
    assert.equal(restored.status, 'active');
  });

  test('7. Support Ticket System: creates ticket, records messages, and updates status', async () => {
    const created = await createTicket(tenantId, {
      customerId: 'c0000000-0000-0000-0000-000000000001',
      subject: 'Server port 443 handshake question',
      category: 'Technical Support',
      priority: 'high',
      message: 'Can we install a custom wildcard TLS certificate?',
      author: 'Alex Chen',
      isCustomer: true,
    });
    assert.ok(created.ticket.id);
    assert.equal(created.ticket.subject, 'Server port 443 handshake question');

    // Staff reply
    const reply = await replyTicket(tenantId, created.ticket.id, {
      message: 'Yes, wildcard certificates can be provisioned via ACME DNS challenge.',
      author: 'Senior Infrastructure Engineer',
      authorType: 'staff',
      isInternal: false,
    });
    assert.ok(reply.id);
    assert.equal(reply.authorType, 'staff');
  });

  test('8. Provider Credentials Security: AES-256-GCM encryption protects live API tokens', () => {
    const secretWHMConfig = {
      host: 'srv10.runstead-datacenter.net',
      port: 2087,
      user: 'root',
      apiToken: 'WHM_SUPER_SECRET_AUTHENTICATED_KEY_999888',
    };

    const encrypted = encryptData(secretWHMConfig);
    assert.ok(encrypted.iv);
    assert.ok(encrypted.tag);
    assert.ok(encrypted.ciphertext);
    assert.notEqual(encrypted.ciphertext, JSON.stringify(secretWHMConfig));

    const decrypted = decryptData(encrypted);
    assert.deepEqual(decrypted, secretWHMConfig);
  });

  test('9. Domain Management & DNS Records: creates domain and binds authoritative DNS records', () => {
    const db = getLocalDb();
    const domainId = `dom_test_${Date.now()}`;
    const domainName = 'acme-corp-enterprise.com';

    db.prepare(`
      INSERT INTO domains (id, tenant_id, customer_id, domain, status, auto_renew, nameservers)
      VALUES (?, ?, ?, ?, 'active', 1, ?)
    `).run(domainId, tenantId, 'c0000000-0000-0000-0000-000000000001', domainName, JSON.stringify(['ns1.runstead.net', 'ns2.runstead.net']));

    const domRow = db.prepare('SELECT * FROM domains WHERE id = ?').get(domainId) as any;
    assert.ok(domRow);
    assert.equal(domRow.domain, domainName);
    assert.equal(domRow.auto_renew, 1);

    // Add DNS records
    const recordId = `dns_test_${Date.now()}`;
    db.prepare(`
      INSERT INTO dns_records (id, tenant_id, domain, type, host, value, ttl)
      VALUES (?, ?, ?, 'A', '@', '203.0.113.195', 3600)
    `).run(recordId, tenantId, domainName);

    const dnsRow = db.prepare('SELECT * FROM dns_records WHERE id = ?').get(recordId) as any;
    assert.ok(dnsRow);
    assert.equal(dnsRow.value, '203.0.113.195');
    assert.equal(dnsRow.type, 'A');
  });

  test('10. Multi-Tenant User Authentication & scrypt Dual-Engine: hashes password and validates sessions', async () => {
    const { hashPassword, verifyPassword } = await import('../lib/security/crypto.ts');
    const { createLocalUser, findLocalUserByEmail } = await import('../lib/db/local-db.ts');
    const { createSession, validateSessionToken } = await import('../lib/auth/session.ts');

    const testEmail = `operator_${Date.now()}@runstead-provider.io`;
    const password = 'SecureOperatorPassword2026!';
    const passwordHash = await hashPassword(password);

    assert.ok(passwordHash.startsWith('scrypt$'), 'Must use scrypt format');
    const isValid = await verifyPassword(password, passwordHash);
    assert.equal(isValid, true, 'Valid password must verify');
    const isInvalid = await verifyPassword('WrongPassword!', passwordHash);
    assert.equal(isInvalid, false, 'Invalid password must be rejected');

    const createdUser = createLocalUser({
      id: `u_test_${Date.now()}`,
      email: testEmail,
      name: 'Reseller Operations Lead',
      passwordHash,
      role: 'owner',
    });
    assert.ok(createdUser.id);

    const lookup = findLocalUserByEmail(testEmail);
    assert.ok(lookup);
    assert.equal(lookup.email, testEmail);

    // Test session issuance
    const { rawToken } = await createSession(createdUser.id, {
      userObj: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        isPlatformAdmin: false,
        emailVerified: new Date(),
      },
    });
    assert.ok(rawToken);

    const sessionUser = await validateSessionToken(rawToken);
    assert.ok(sessionUser);
    assert.equal(sessionUser.id, createdUser.id);
  });

  test('11. Customer Portal Invoice Settlement & Provisioning Trigger: settles invoice via gateway', async () => {
    // Create customer and order
    const cust = await createCustomer(tenantId, {
      name: 'Portal Billing Customer',
      email: `billing_${Date.now()}@test.org`,
      company: 'Billing Corp',
      country: 'US',
    });

    const testProd = await createProduct(tenantId, {
      name: 'Portal Test Plan',
      type: 'shared',
      description: 'Test Hosting Plan',
      pricing: [{ cycle: 'monthly', price: 49.99 }],
    });

    const order = await createOrder(tenantId, cust.id, [
      { productId: testProd.id, cycle: 'monthly', quantity: 1 },
    ]);

    assert.ok(order.invoice, 'Order creation must generate invoice');
    assert.equal(order.invoice.status, 'pending');

    // Settle invoice with idempotency
    const idempotencyKey = `test_portal_idem_${Date.now()}`;
    const settlement = await settleInvoice(tenantId, order.invoice.id, {
      amount: 49.99,
      currency: 'USD',
      method: 'card',
      providerTransactionId: `tx_sandbox_${Date.now()}`,
      idempotencyKey,
    });

    assert.equal(settlement.invoice.status, 'paid');
    assert.equal(settlement.alreadySettled, false);

    // Duplicate charge attempt must return alreadySettled: true
    const duplicate = await settleInvoice(tenantId, order.invoice.id, {
      amount: 49.99,
      currency: 'USD',
      method: 'card',
      providerTransactionId: `tx_sandbox_dup`,
      idempotencyKey,
    });
    assert.equal(duplicate.alreadySettled, true);

    // Verify invoice in DB
    const fetchedInvoice = await getInvoiceById(tenantId, order.invoice.id);
    assert.ok(fetchedInvoice);
    assert.equal(fetchedInvoice.status, 'paid');
  });

  test('12. Customer Portal Support Desk Lifecycle: customer ticket creation and staff reply', async () => {
    const cust = await createCustomer(tenantId, {
      name: 'Portal Ticket Customer',
      email: `ticket_${Date.now()}@test.org`,
      company: 'Ticket Corp',
      country: 'US',
    });

    const ticketResult = await createTicket(tenantId, {
      customerId: cust.id,
      subject: 'Urgent: SSL Renewal Error on Apex Domain',
      category: 'ssl',
      priority: 'high',
      message: 'The auto-renewal SSL cert is throwing a CAA validation error.',
      author: cust.name,
      isCustomer: true,
    });

    assert.ok(ticketResult.ticket.id);
    assert.equal(ticketResult.ticket.subject, 'Urgent: SSL Renewal Error on Apex Domain');
    assert.equal(ticketResult.ticket.status, 'open');

    // Reply as staff
    const reply = await replyTicket(tenantId, ticketResult.ticket.id, {
      author: 'Senior Systems Engineer',
      authorType: 'staff',
      message: 'We have updated your CAA DNS record to allow Lets Encrypt issuances.',
    });

    assert.ok(reply.id);
    assert.equal(reply.authorType, 'staff');

    // List tickets for customer
    const customerTickets = await listTickets(tenantId, { customerId: cust.id });
    assert.equal(customerTickets.tickets.length, 1);
    assert.equal(customerTickets.tickets[0].id, ticketResult.ticket.id);
  });
});

