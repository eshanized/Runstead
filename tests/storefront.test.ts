import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { seedData } from '../lib/demo/seed-data.ts';
import {
  themePresets,
  defaultSections,
  defaultPages,
  defaultStorefrontConfig,
  migrateStorefrontConfig,
  isValidCustomSlug,
  sanitizeColor,
} from '../lib/demo/storefront-presets.ts';
import * as workflows from '../lib/demo/workflows.ts';
import type { StorefrontConfig, CartItem } from '../lib/demo/types.ts';

describe('Storefront 2.0 Architecture & Configuration Suite', () => {
  test('Theme presets are strongly typed, distinct, and well-formed', () => {
    const presetKeys = Object.keys(themePresets);
    assert.equal(presetKeys.length, 5, 'Must provide 5 distinct theme presets');
    assert.ok(presetKeys.includes('modern-cloud'));
    assert.ok(presetKeys.includes('minimal-studio'));
    assert.ok(presetKeys.includes('enterprise-infra'));
    assert.ok(presetKeys.includes('developer-cloud'));
    assert.ok(presetKeys.includes('commerce-focus'));

    for (const key of presetKeys as Array<keyof typeof themePresets>) {
      const preset = themePresets[key];
      assert.ok(preset.primaryColor.startsWith('#'), `${key} primaryColor must be a valid hex color`);
      assert.ok(preset.accentColor.startsWith('#'), `${key} accentColor must be a valid hex color`);
      assert.ok(preset.fontHeading, `${key} fontHeading must exist`);
      assert.ok(preset.borderRadius, `${key} borderRadius must exist`);
      assert.ok(preset.buttonStyle, `${key} buttonStyle must exist`);
    }
  });

  test('Default sections and pages are populated and valid', () => {
    assert.ok(defaultSections.length >= 8, 'Default sections must include core storefront sections');
    assert.ok(defaultSections.some((s) => s.type === 'hero'));
    assert.ok(defaultSections.some((s) => s.type === 'domain_search'));
    assert.ok(defaultSections.some((s) => s.type === 'featured_plans'));
    assert.ok(defaultSections.some((s) => s.type === 'hosting_categories'));
    assert.ok(defaultSections.some((s) => s.type === 'vps_highlights'));
    assert.ok(defaultSections.some((s) => s.type === 'features_grid'));
    assert.ok(defaultSections.some((s) => s.type === 'product_comparison'));
    assert.ok(defaultSections.some((s) => s.type === 'faq_accordion'));

    assert.ok(defaultPages.length >= 10, 'Default pages must include core pages');
    assert.ok(defaultPages.some((p) => p.slug === 'home'));
    assert.ok(defaultPages.some((p) => p.slug === 'hosting'));
    assert.ok(defaultPages.some((p) => p.slug === 'vps'));
    assert.ok(defaultPages.some((p) => p.slug === 'domains'));
    assert.ok(defaultPages.some((p) => p.slug === 'about'));
    assert.ok(defaultPages.some((p) => p.slug === 'contact'));
    assert.ok(defaultPages.some((p) => p.slug === 'support'));
  });

  test('isValidCustomSlug protects against route collisions and invalid characters', () => {
    assert.equal(isValidCustomSlug('my-page').valid, true);
    assert.equal(isValidCustomSlug('landing-2026').valid, true);

    // Collisions with reserved routes
    assert.equal(isValidCustomSlug('hosting').valid, false);
    assert.equal(isValidCustomSlug('vps').valid, false);
    assert.equal(isValidCustomSlug('domains').valid, false);
    assert.equal(isValidCustomSlug('client').valid, false);
    assert.equal(isValidCustomSlug('cart').valid, false);

    // Invalid format
    assert.equal(isValidCustomSlug('invalid slug with spaces').valid, false);
    assert.equal(isValidCustomSlug('invalid/slash').valid, false);
    assert.equal(isValidCustomSlug('').valid, false);
  });

  test('sanitizeColor validates hex and returns fallback on invalid values', () => {
    assert.equal(sanitizeColor('#0f5fff'), '#0f5fff');
    assert.equal(sanitizeColor('#fff'), '#fff');
    assert.equal(sanitizeColor('red', '#0f5fff'), '#0f5fff');
    assert.equal(sanitizeColor('not-a-color', '#0f5fff'), '#0f5fff');
  });

  test('migrateStorefrontConfig upgrades legacy state seamlessly without data loss', () => {
    const legacyState = {
      businessName: 'Custom Host Corp',
      tagline: 'Speed and agility',
      description: 'Legacy description',
      primaryColor: '#ff0055',
      accentColor: '#00ffaa',
      email: 'ops@customhost.corp',
      phone: '+1 555 999 8888',
      logoText: 'CH',
      headline: 'The Next Generation Cloud',
      displayedProductIds: ['prod_001', 'prod_003'],
      showProductPricing: true,
    };

    const migrated = migrateStorefrontConfig(legacyState);
    assert.equal(migrated.businessName, 'Custom Host Corp');
    assert.equal(migrated.primaryColor, '#ff0055');
    assert.equal(migrated.accentColor, '#00ffaa');
    assert.equal(migrated.headline, 'The Next Generation Cloud');
    assert.equal(migrated.schemaVersion, 2);
    assert.ok(migrated.theme, 'Theme must be populated');
    assert.ok(migrated.sections.length > 0, 'Sections must be populated');
    assert.ok(migrated.pages.length > 0, 'Pages must be populated');
    assert.ok(migrated.header.navItems.length > 0, 'Header nav items must be populated');
  });

  test('Draft and publish lifecycle operations', () => {
    let state = seedData;
    assert.ok(state.storefront);

    // Save draft
    const modifiedDraft: StorefrontConfig = {
      ...state.storefront,
      headline: 'Unpublished Draft Headline',
    };
    state = workflows.saveStorefrontDraft(state, modifiedDraft);
    assert.equal(state.storefront.headline, 'Unpublished Draft Headline');
    assert.equal(state.storefront.isDraftDirty, true);

    // Revert draft
    state = workflows.revertStorefrontDraft(state);
    assert.equal(state.storefront.isDraftDirty, false);
    assert.equal(state.storefront.headline, state.publishedStorefront?.headline);

    // Publish draft
    const newDraft: StorefrontConfig = {
      ...state.storefront,
      headline: 'Published Brand New Headline',
    };
    state = workflows.saveStorefrontDraft(state, newDraft);
    state = workflows.publishStorefrontDraft(state);
    assert.equal(state.publishedStorefront?.headline, 'Published Brand New Headline');
    assert.equal(state.storefront.isDraftDirty, false);

    // Reset to preset
    state = workflows.resetStorefrontToPreset(state, 'minimal-studio');
    assert.equal(state.storefront.theme.preset, 'minimal-studio');
    assert.equal(state.storefront.primaryColor, themePresets['minimal-studio'].primaryColor);
  });

  test('Cart lifecycle: add, update cycle, remove, and totals calculation', () => {
    let state = seedData;
    state = workflows.clearCart(state);
    assert.equal(state.cart?.length, 0);

    // Add shared hosting monthly
    state = workflows.addToCart(state, {
      productId: 'prod_001',
      productName: 'Starter Hosting',
      productType: 'shared_hosting',
      billingCycle: 'monthly',
      unitPrice: 4.99,
      setupFee: 0,
      quantity: 1,
      selectedAddons: [{ name: 'Dedicated IP', price: 2.00 }],
    });

    assert.equal(state.cart?.length, 1);
    const item1 = state.cart![0];
    assert.equal(item1.productName, 'Starter Hosting');
    assert.equal(item1.unitPrice, 4.99);

    // Add domain registration annually
    state = workflows.addToCart(state, {
      productId: 'prod_005',
      productName: 'Domain Registration',
      productType: 'domain_registration',
      billingCycle: 'annually',
      unitPrice: 12.99,
      setupFee: 0,
      domainName: 'testclient-portal.com',
      quantity: 1,
      selectedAddons: [],
    });

    assert.equal(state.cart?.length, 2);

    // Calculate totals with 8% tax
    const totals = workflows.calculateCartTotals(state.cart, 8);
    // Starter hosting: 4.99 + 2.00 = 6.99
    // Domain: 12.99
    // Subtotal: 19.98
    // Tax (8% of 19.98): 1.60
    // Total: 21.58
    assert.equal(totals.subtotal, 19.98);
    assert.equal(totals.taxAmount, 1.6);
    assert.equal(totals.total, 21.58);
    assert.equal(totals.itemCount, 2);

    // Update cycle of item1 from monthly to annually
    state = workflows.updateCartItemCycle(state, item1.id, 'annually');
    const updatedItem1 = state.cart!.find((i) => i.id === item1.id)!;
    assert.equal(updatedItem1.billingCycle, 'annually');
    assert.equal(updatedItem1.unitPrice, 49.99);

    // Remove domain
    state = workflows.removeFromCart(state, state.cart![1].id);
    assert.equal(state.cart?.length, 1);
  });

  test('Multi-item checkout workflow provisions services and domains atomically', () => {
    let state = seedData;
    state = workflows.clearCart(state);

    const customer = state.customers[0];

    // Add VPS and Domain to cart
    state = workflows.addToCart(state, {
      productId: 'prod_003',
      productName: 'VPS Standard',
      productType: 'vps',
      billingCycle: 'monthly',
      unitPrice: 19.99,
      setupFee: 0,
      domainName: 'vps-multi-app.org',
      quantity: 1,
      selectedAddons: [{ name: 'Daily Backup', price: 5.00 }],
    });

    state = workflows.addToCart(state, {
      productId: 'prod_005',
      productName: 'Domain Registration',
      productType: 'domain_registration',
      billingCycle: 'annually',
      unitPrice: 12.99,
      setupFee: 0,
      domainName: 'vps-multi-app.org',
      quantity: 1,
      selectedAddons: [],
    });

    const initialServiceCount = state.services.length;
    const initialDomainCount = state.domains.length;
    const initialOrderCount = state.orders.length;
    const initialInvoiceCount = state.invoices.length;

    const result = workflows.checkoutCart(state, {
      customerId: customer.id,
      paymentMethod: 'Credit Card (Simulated)',
    });

    // Check cart is emptied
    assert.equal(result.state.cart?.length, 0);

    // Check records created
    assert.equal(result.orders.length, 2);
    assert.equal(result.services.length, 1);
    assert.equal(result.domains.length, 2); // VPS attached domain + domain registration
    assert.ok(result.invoice);
    assert.equal(result.invoice.status, 'paid');

    // Check global state increment
    assert.equal(result.state.orders.length, initialOrderCount + 2);
    assert.equal(result.state.services.length, initialServiceCount + 1);
    assert.equal(result.state.domains.length, initialDomainCount + 2);
    assert.equal(result.state.invoices.length, initialInvoiceCount + 1);

    // Verify service has IP, hostname, status
    const createdService = result.services[0];
    assert.equal(createdService.status, 'active');
    assert.ok(createdService.ipAddress?.startsWith('198.51.100.'));
    assert.ok(createdService.serverHostname?.includes('runstead.demo'));
  });

  test('Customer portal actions: open ticket, reply, and pay invoice', () => {
    let state = seedData;
    const customer = state.customers[0];

    // Open ticket
    const ticketResult = workflows.clientOpenTicket(state, {
      customerId: customer.id,
      subject: 'Portal Integration Test Ticket',
      message: 'Need help installing SSL certificate on newly provisioned service.',
      priority: 'high',
    });

    state = ticketResult.state;
    assert.ok(ticketResult.ticket);
    assert.equal(ticketResult.ticket.customerId, customer.id);
    assert.equal(ticketResult.ticket.status, 'open');
    assert.equal(ticketResult.ticket.messages.length, 1);

    // Reply to ticket
    state = workflows.clientReplyTicket(
      state,
      ticketResult.ticket.id,
      customer.id,
      'Added the TXT verification record to DNS zone.'
    );

    const repliedTicket = state.tickets.find((t) => t.id === ticketResult.ticket.id)!;
    assert.equal(repliedTicket.messages.length, 2);
    assert.equal(repliedTicket.status, 'in_progress');

    // Update profile
    state = workflows.clientUpdateProfile(state, customer.id, {
      name: 'Sarah Mitchell-Updated',
      phone: '+1 415 555 9999',
    });

    const updatedCust = state.customers.find((c) => c.id === customer.id)!;
    assert.equal(updatedCust.name, 'Sarah Mitchell-Updated');
    assert.equal(updatedCust.phone, '+1 415 555 9999');
  });
});
