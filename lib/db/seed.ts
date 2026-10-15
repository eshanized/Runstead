import { PrismaClient } from '@prisma/client';
import { prisma, withTenantContext } from './client.ts';

export const SEED_TENANT_A_ID = '11111111-1111-1111-1111-111111111111';
export const SEED_TENANT_B_ID = '22222222-2222-2222-2222-222222222222';

export const SEED_USER_A_ID = 'a1111111-1111-1111-1111-111111111111';
export const SEED_USER_B_ID = 'b2222222-2222-2222-2222-222222222222';

export const SEED_CUSTOMER_A1_ID = 'c1111111-1111-1111-1111-111111111111';
export const SEED_CUSTOMER_A2_ID = 'c1111111-1111-1111-1111-111111111112';
export const SEED_CUSTOMER_B1_ID = 'c2222222-2222-2222-2222-222222222221';
export const SEED_CUSTOMER_B2_ID = 'c2222222-2222-2222-2222-222222222222';

export const SEED_PRODUCT_A1_ID = 'd1111111-1111-1111-1111-111111111111';
export const SEED_PRODUCT_B1_ID = 'd2222222-2222-2222-2222-222222222221';

export const SEED_ORDER_A1_ID = 'e1111111-1111-1111-1111-111111111111';
export const SEED_ORDER_B1_ID = 'e2222222-2222-2222-2222-222222222221';

export const SEED_INVOICE_A1_ID = 'f1111111-1111-1111-1111-111111111111';
export const SEED_INVOICE_B1_ID = 'f2222222-2222-2222-2222-222222222221';

export const SEED_SERVICE_A1_ID = 'a1111111-2222-3333-4444-111111111111';
export const SEED_SERVICE_B1_ID = 'b2222222-2222-3333-4444-222222222221';

export const SEED_DOMAIN_A1_ID = 'a1111111-3333-4444-5555-111111111111';
export const SEED_DOMAIN_B1_ID = 'b2222222-3333-4444-5555-222222222221';

export const SEED_DNS_A1_ID = 'a1111111-4444-5555-6666-111111111111';
export const SEED_DNS_B1_ID = 'b2222222-4444-5555-6666-222222222221';

export const SEED_TICKET_A1_ID = 'a1111111-5555-6666-7777-111111111111';
export const SEED_TICKET_B1_ID = 'b2222222-5555-6666-7777-222222222221';

/**
 * Deterministically seeds the database with synthetic development/testing data.
 * Safe for repeated runs. Guaranteed to never execute against production environments.
 */
export async function seedDatabase(prismaClient?: PrismaClient) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SAFETY CHECK: Refusing to seed database when NODE_ENV is "production"!');
  }

  const db = prismaClient || prisma;

  console.log('Seeding Runstead PostgreSQL database with synthetic multi-tenant fixtures...');

  // 1. Seed Global Platform Users (No RLS restrictions)
  const userA = await db.user.upsert({
    where: { id: SEED_USER_A_ID },
    update: { email: 'admin@apexcloud.dev', name: 'Alice Apex' },
    create: {
      id: SEED_USER_A_ID,
      email: 'admin@apexcloud.dev',
      name: 'Alice Apex',
      isPlatformAdmin: false,
    },
  });

  const userB = await db.user.upsert({
    where: { id: SEED_USER_B_ID },
    update: { email: 'admin@nordichost.dev', name: 'Bjorn Nordic' },
    create: {
      id: SEED_USER_B_ID,
      email: 'admin@nordichost.dev',
      name: 'Bjorn Nordic',
      isPlatformAdmin: false,
    },
  });

  // 2. Seed Tenant A fixtures within Tenant A's transaction-scoped RLS context
  await withTenantContext(SEED_TENANT_A_ID, async (tx) => {
    // Tenant A root
    const tenantA = await tx.tenant.upsert({
      where: { id: SEED_TENANT_A_ID },
      update: {
        name: 'Apex Cloud Solutions [Development]',
        slug: 'apexcloud-dev',
        planTier: 'Growth',
        currency: 'USD',
        taxRate: 10.0,
      },
      create: {
        id: SEED_TENANT_A_ID,
        name: 'Apex Cloud Solutions [Development]',
        slug: 'apexcloud-dev',
        planTier: 'Growth',
        currency: 'USD',
        taxRate: 10.0,
        brandConfig: {
          primaryColor: '#2563eb',
          accentColor: '#38bdf8',
          logoText: 'Apex Cloud',
        },
      },
    });

    // Tenant A Membership
    await tx.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenantA.id, userId: userA.id } },
      update: { role: 'owner' },
      create: {
        tenantId: tenantA.id,
        userId: userA.id,
        role: 'owner',
      },
    });

    // Customers for Tenant A
    const customerA1 = await tx.customer.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_CUSTOMER_A1_ID } },
      update: { name: 'Acme Corp (Tenant A)', email: 'contact@acmecorp.dev' },
      create: {
        id: SEED_CUSTOMER_A1_ID,
        tenantId: tenantA.id,
        name: 'Acme Corp (Tenant A)',
        email: 'contact@acmecorp.dev',
        company: 'Acme International',
        status: 'active',
        country: 'US',
        creditBalance: 150.0,
        totalRevenue: 2400.0,
      },
    });

    await tx.customer.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_CUSTOMER_A2_ID } },
      update: { name: 'Globex Inc (Tenant A)', email: 'billing@globex.dev' },
      create: {
        id: SEED_CUSTOMER_A2_ID,
        tenantId: tenantA.id,
        name: 'Globex Inc (Tenant A)',
        email: 'billing@globex.dev',
        status: 'active',
        country: 'US',
      },
    });

    // Product & Pricing for Tenant A
    const productA = await tx.product.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_PRODUCT_A1_ID } },
      update: { name: 'Pro Cloud NVMe Hosting', available: true },
      create: {
        id: SEED_PRODUCT_A1_ID,
        tenantId: tenantA.id,
        name: 'Pro Cloud NVMe Hosting',
        type: 'shared_hosting',
        description: 'High performance NVMe WordPress and web hosting.',
        setupFee: 0.0,
        available: true,
        resourceLimits: [
          { label: 'NVMe Disk', value: '50 GB' },
          { label: 'Bandwidth', value: 'Unmetered' },
        ],
      },
    });

    await tx.productPricing.upsert({
      where: { tenantId_productId_cycle: { tenantId: tenantA.id, productId: productA.id, cycle: 'monthly' } },
      update: { price: 29.99 },
      create: {
        tenantId: tenantA.id,
        productId: productA.id,
        cycle: 'monthly',
        price: 29.99,
      },
    });

    // Orders & Order Items for Tenant A
    const orderA = await tx.order.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_ORDER_A1_ID } },
      update: { status: 'paid', amount: 29.99 },
      create: {
        id: SEED_ORDER_A1_ID,
        tenantId: tenantA.id,
        orderNumber: 'ORD-A-1001',
        customerId: customerA1.id,
        productId: productA.id,
        status: 'paid',
        amount: 29.99,
        billingCycle: 'monthly',
      },
    });

    await tx.orderItem.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: 'e1111111-1111-1111-1111-111111111112' } },
      update: { totalAmount: 29.99 },
      create: {
        id: 'e1111111-1111-1111-1111-111111111112',
        tenantId: tenantA.id,
        orderId: orderA.id,
        productId: productA.id,
        description: 'Pro Cloud NVMe Hosting - Monthly Plan',
        quantity: 1,
        unitPrice: 29.99,
        totalAmount: 29.99,
      },
    });

    // Invoices & Payments for Tenant A
    const invoiceA = await tx.invoice.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_INVOICE_A1_ID } },
      update: { status: 'paid', totalAmount: 32.99 },
      create: {
        id: SEED_INVOICE_A1_ID,
        tenantId: tenantA.id,
        invoiceNumber: 'INV-A-1001',
        customerId: customerA1.id,
        orderId: orderA.id,
        status: 'paid',
        issueDate: new Date('2026-09-01T00:00:00Z'),
        dueDate: new Date('2026-09-15T00:00:00Z'),
        paidDate: new Date('2026-09-02T12:00:00Z'),
        currency: 'USD',
        subtotal: 29.99,
        taxRate: 10.0,
        taxAmount: 3.0,
        totalAmount: 32.99,
      },
    });

    await tx.payment.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: 'f1111111-1111-1111-1111-111111111112' } },
      update: { status: 'succeeded' },
      create: {
        id: 'f1111111-1111-1111-1111-111111111112',
        tenantId: tenantA.id,
        invoiceId: invoiceA.id,
        customerId: customerA1.id,
        amount: 32.99,
        currency: 'USD',
        method: 'stripe',
        providerTransactionId: 'ch_test_apex_12345',
        status: 'succeeded',
        settledAt: new Date('2026-09-02T12:00:00Z'),
      },
    });

    // Services for Tenant A
    await tx.service.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_SERVICE_A1_ID } },
      update: { status: 'active', ipAddress: '198.51.100.10' },
      create: {
        id: SEED_SERVICE_A1_ID,
        tenantId: tenantA.id,
        customerId: customerA1.id,
        productId: productA.id,
        orderId: orderA.id,
        serviceName: 'acme-corp.com Shared Cloud',
        package: 'Pro Cloud NVMe',
        domain: 'acme-corp.com',
        status: 'active',
        billingCycle: 'monthly',
        price: 29.99,
        ipAddress: '198.51.100.10',
        serverHostname: 'srv1.apexcloud.dev',
        username: 'acmecorp',
      },
    });

    // Domains & DNS Records for Tenant A
    const domainA = await tx.domain.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_DOMAIN_A1_ID } },
      update: { status: 'active' },
      create: {
        id: SEED_DOMAIN_A1_ID,
        tenantId: tenantA.id,
        customerId: customerA1.id,
        domainName: 'acme-corp.com',
        status: 'active',
        registrar: 'internal',
        autoRenew: true,
        nameservers: ['ns1.apexcloud.dev', 'ns2.apexcloud.dev'],
      },
    });

    await tx.dnsRecord.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_DNS_A1_ID } },
      update: { value: '198.51.100.10' },
      create: {
        id: SEED_DNS_A1_ID,
        tenantId: tenantA.id,
        domainId: domainA.id,
        type: 'A',
        host: '@',
        value: '198.51.100.10',
        ttl: 3600,
      },
    });

    // Tickets & Ticket Messages for Tenant A
    const ticketA = await tx.ticket.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: SEED_TICKET_A1_ID } },
      update: { status: 'in_progress' },
      create: {
        id: SEED_TICKET_A1_ID,
        tenantId: tenantA.id,
        ticketNumber: 'TCK-A-1001',
        customerId: customerA1.id,
        subject: 'PHP 8.3 memory limit inquiry',
        category: 'Technical Support',
        status: 'in_progress',
        priority: 'medium',
      },
    });

    await tx.ticketMessage.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: 'a1111111-5555-6666-7777-111111111112' } },
      update: { message: 'Can you increase memory_limit to 512M?' },
      create: {
        id: 'a1111111-5555-6666-7777-111111111112',
        tenantId: tenantA.id,
        ticketId: ticketA.id,
        author: 'Acme Corp Admin',
        authorType: 'customer',
        message: 'Can you increase memory_limit to 512M?',
        isInternal: false,
      },
    });

    // Credentials, Background Jobs, Audit Events for Tenant A
    await tx.providerCredential.upsert({
      where: { tenantId_providerName: { tenantId: tenantA.id, providerName: 'cpanel_whm_primary' } },
      update: { status: 'connected' },
      create: {
        tenantId: tenantA.id,
        providerName: 'cpanel_whm_primary',
        category: 'hosting',
        status: 'connected',
        encryptedConfig: { endpoint: 'https://srv1.apexcloud.dev:2087' },
      },
    });

    await tx.backgroundJob.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: 'a1111111-6666-7777-8888-111111111111' } },
      update: { status: 'completed' },
      create: {
        id: 'a1111111-6666-7777-8888-111111111111',
        tenantId: tenantA.id,
        jobType: 'provision_hosting_account',
        status: 'completed',
        attempts: 1,
        payload: { serviceId: SEED_SERVICE_A1_ID },
      },
    });

    await tx.auditEvent.upsert({
      where: { tenantId_id: { tenantId: tenantA.id, id: 'a1111111-7777-8888-9999-111111111111' } },
      update: { action: 'order.placed' },
      create: {
        id: 'a1111111-7777-8888-9999-111111111111',
        tenantId: tenantA.id,
        actorId: userA.id,
        actorType: 'staff',
        action: 'order.placed',
        resourceType: 'order',
        resourceId: orderA.id,
      },
    });
  }, db);

  // 3. Seed Tenant B fixtures within Tenant B's transaction-scoped RLS context
  await withTenantContext(SEED_TENANT_B_ID, async (tx) => {
    // Tenant B root
    const tenantB = await tx.tenant.upsert({
      where: { id: SEED_TENANT_B_ID },
      update: {
        name: 'Nordic Host Telecom [Development]',
        slug: 'nordichost-dev',
        planTier: 'Scale',
        currency: 'EUR',
        taxRate: 20.0,
      },
      create: {
        id: SEED_TENANT_B_ID,
        name: 'Nordic Host Telecom [Development]',
        slug: 'nordichost-dev',
        planTier: 'Scale',
        currency: 'EUR',
        taxRate: 20.0,
        brandConfig: {
          primaryColor: '#059669',
          accentColor: '#34d399',
          logoText: 'Nordic Host',
        },
      },
    });

    // Tenant B Membership
    await tx.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenantB.id, userId: userB.id } },
      update: { role: 'owner' },
      create: {
        tenantId: tenantB.id,
        userId: userB.id,
        role: 'owner',
      },
    });

    // Customers for Tenant B
    const customerB1 = await tx.customer.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_CUSTOMER_B1_ID } },
      update: { name: 'Oslo Media AS (Tenant B)', email: 'kontakt@oslomedia.dev' },
      create: {
        id: SEED_CUSTOMER_B1_ID,
        tenantId: tenantB.id,
        name: 'Oslo Media AS (Tenant B)',
        email: 'kontakt@oslomedia.dev',
        company: 'Oslo Media Group',
        status: 'active',
        country: 'NO',
        creditBalance: 75.0,
        totalRevenue: 1800.0,
      },
    });

    await tx.customer.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_CUSTOMER_B2_ID } },
      update: { name: 'Bergen Web Studio (Tenant B)', email: 'post@bergenweb.dev' },
      create: {
        id: SEED_CUSTOMER_B2_ID,
        tenantId: tenantB.id,
        name: 'Bergen Web Studio (Tenant B)',
        email: 'post@bergenweb.dev',
        status: 'active',
        country: 'NO',
      },
    });

    // Products & Pricing for Tenant B
    const productB = await tx.product.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_PRODUCT_B1_ID } },
      update: { name: 'Nordic Dedicated VPS-4', available: true },
      create: {
        id: SEED_PRODUCT_B1_ID,
        tenantId: tenantB.id,
        name: 'Nordic Dedicated VPS-4',
        type: 'vps',
        description: 'KVM Virtual Server in Oslo Datacenter.',
        setupFee: 15.0,
        available: true,
        resourceLimits: [
          { label: 'vCPU', value: '4 Cores' },
          { label: 'RAM', value: '16 GB' },
        ],
      },
    });

    await tx.productPricing.upsert({
      where: { tenantId_productId_cycle: { tenantId: tenantB.id, productId: productB.id, cycle: 'monthly' } },
      update: { price: 49.0 },
      create: {
        tenantId: tenantB.id,
        productId: productB.id,
        cycle: 'monthly',
        price: 49.0,
      },
    });

    // Orders for Tenant B
    const orderB = await tx.order.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_ORDER_B1_ID } },
      update: { status: 'paid', amount: 64.0 },
      create: {
        id: SEED_ORDER_B1_ID,
        tenantId: tenantB.id,
        orderNumber: 'ORD-B-2001',
        customerId: customerB1.id,
        productId: productB.id,
        status: 'paid',
        amount: 64.0,
        billingCycle: 'monthly',
      },
    });

    // Invoices for Tenant B
    await tx.invoice.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_INVOICE_B1_ID } },
      update: { status: 'paid', totalAmount: 76.8 },
      create: {
        id: SEED_INVOICE_B1_ID,
        tenantId: tenantB.id,
        invoiceNumber: 'INV-B-2001',
        customerId: customerB1.id,
        orderId: orderB.id,
        status: 'paid',
        issueDate: new Date('2026-09-01T00:00:00Z'),
        dueDate: new Date('2026-09-15T00:00:00Z'),
        paidDate: new Date('2026-09-03T10:00:00Z'),
        currency: 'EUR',
        subtotal: 64.0,
        taxRate: 20.0,
        taxAmount: 12.8,
        totalAmount: 76.8,
      },
    });

    // Services for Tenant B
    await tx.service.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_SERVICE_B1_ID } },
      update: { status: 'active', ipAddress: '203.0.113.25' },
      create: {
        id: SEED_SERVICE_B1_ID,
        tenantId: tenantB.id,
        customerId: customerB1.id,
        productId: productB.id,
        orderId: orderB.id,
        serviceName: 'oslomedia.no Production VPS',
        package: 'Nordic Dedicated VPS-4',
        domain: 'oslomedia.no',
        status: 'active',
        billingCycle: 'monthly',
        price: 49.0,
        ipAddress: '203.0.113.25',
        serverHostname: 'no-srv1.nordichost.dev',
        username: 'oslomedia',
      },
    });

    // Domains & DNS Records for Tenant B
    const domainB = await tx.domain.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_DOMAIN_B1_ID } },
      update: { status: 'active' },
      create: {
        id: SEED_DOMAIN_B1_ID,
        tenantId: tenantB.id,
        customerId: customerB1.id,
        domainName: 'oslomedia.no',
        status: 'active',
        registrar: 'internal',
        autoRenew: true,
        nameservers: ['ns1.nordichost.dev', 'ns2.nordichost.dev'],
      },
    });

    await tx.dnsRecord.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_DNS_B1_ID } },
      update: { value: '203.0.113.25' },
      create: {
        id: SEED_DNS_B1_ID,
        tenantId: tenantB.id,
        domainId: domainB.id,
        type: 'A',
        host: '@',
        value: '203.0.113.25',
        ttl: 3600,
      },
    });

    // Tickets for Tenant B
    await tx.ticket.upsert({
      where: { tenantId_id: { tenantId: tenantB.id, id: SEED_TICKET_B1_ID } },
      update: { status: 'open' },
      create: {
        id: SEED_TICKET_B1_ID,
        tenantId: tenantB.id,
        ticketNumber: 'TCK-B-2001',
        customerId: customerB1.id,
        subject: 'IPv6 reverse DNS assignment',
        category: 'Network Support',
        status: 'open',
        priority: 'high',
      },
    });
  }, db);

  console.log('Successfully seeded database with Tenant A and Tenant B fixtures under RLS context.');
}

// Allow direct CLI execution: node --experimental-strip-types lib/db/seed.ts
if (process.argv[1]?.endsWith('lib/db/seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    });
}
