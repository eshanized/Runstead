import { test, expect } from '@playwright/test';

test.describe('HostPilot Storefront Experience 2.0 End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to initialize app and local storage
    await page.goto('/demo/overview');
    await page.waitForLoadState('networkidle');
  });

  test('1. Storefront Editor: 3-Region Visual Builder, Viewport Toggles, Theme Switching, and Publish Semantics', async ({ page }) => {
    await page.goto('/demo/storefront');
    await page.waitForLoadState('networkidle');

    // Verify 3-region workspace structure
    await expect(page.locator('text=Storefront Experience 2.0')).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();

    // Verify Viewport Switcher
    const tabletBtn = page.locator('button:has-text("Tablet")');
    const mobileBtn = page.locator('button:has-text("Mobile")');
    const desktopBtn = page.locator('button:has-text("Desktop")');

    await expect(tabletBtn).toBeVisible();
    await expect(mobileBtn).toBeVisible();
    await expect(desktopBtn).toBeVisible();

    await tabletBtn.click();
    await mobileBtn.click();
    await desktopBtn.click();

    // Switch to Theme Tab
    const themeTab = page.locator('button[role="tab"]:has-text("Theme")');
    await themeTab.click();
    await expect(page.locator('text=Theme Presets')).toBeVisible();
    await expect(page.locator('text=Enterprise Infrastructure')).toBeVisible();

    // Switch to Enterprise Infrastructure preset
    await page.locator('div:has-text("Enterprise Infrastructure")').last().click();
    await expect(page.locator('text=Applied "Enterprise Infrastructure" theme preset')).toBeVisible();

    // Verify Draft Dirty indicator shows
    await expect(page.locator('text=Unpublished Changes').first()).toBeVisible();

    // Switch to Branding tab
    const brandTab = page.locator('button[role="tab"]:has-text("Brand")');
    await brandTab.click();
    await expect(page.locator('text=Business Identity')).toBeVisible();

    // Update business name
    const bizInput = page.locator('input[placeholder="e.g. Apex Hosting Co."]');
    await bizInput.fill('Apex Reseller Cloud');

    // Save draft
    const saveBtn = page.locator('button:has-text("Save Draft")');
    await saveBtn.click();
    await expect(page.locator('text=Draft configuration saved')).toBeVisible();

    // Publish to Live
    const publishBtn = page.locator('button:has-text("Publish to Live")');
    await publishBtn.click();
    await expect(page.locator('text=Storefront published! Live preview is now updated.')).toBeVisible();
    await expect(page.locator('text=Published').first()).toBeVisible();
  });

  test('2. Multi-Page Storefront Catalog, Domain Marketplace, and Dynamic Pages', async ({ page }) => {
    // 1. Home Page
    await page.goto('/demo/storefront-preview');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[placeholder*="ideal domain"]')).toBeVisible();

    // 2. Hosting Catalog
    await page.goto('/demo/storefront-preview/hosting');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Hosting Catalog")')).toBeVisible();

    // Filter products
    const searchInput = page.locator('input[placeholder*="Search by package name"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Shared');
      await page.waitForTimeout(300);
    }

    // 3. Product Details Page
    await page.goto('/demo/storefront-preview/hosting/prod_001');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Add to Shopping Cart")')).toBeVisible();

    // Add to cart
    await page.click('button:has-text("Add to Shopping Cart")');
    await expect(page.locator('text=added to shopping cart!')).toBeVisible();

    // 4. Cloud VPS Catalog
    await page.goto('/demo/storefront-preview/vps');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Cloud VPS")')).toBeVisible();

    // 5. Domain Marketplace & Transfer
    await page.goto('/demo/storefront-preview/domains');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Domain Registration & Marketplace')).toBeVisible();

    // Domain availability check
    await page.fill('input[placeholder*="yourdomain.com"]', 'quantumcloud-sample.com');
    await page.click('button:has-text("Check Availability")');
    await expect(page.locator('text=Available').first()).toBeVisible();

    // Domain transfer page
    await page.goto('/demo/storefront-preview/domains/transfer');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Domain Transfer Assistance')).toBeVisible();

    // 6. Status, Knowledge Base, Contact, and Legal Pages
    await page.goto('/demo/storefront-preview/status');
    await expect(page.locator('text=Operational Status')).toBeVisible();

    await page.goto('/demo/storefront-preview/knowledge-base');
    await expect(page.locator('text=Knowledge Base')).toBeVisible();

    await page.goto('/demo/storefront-preview/contact');
    await expect(page.locator('text=Contact Our Team')).toBeVisible();

    await page.goto('/demo/storefront-preview/privacy');
    await expect(page.locator('text=Privacy Policy')).toBeVisible();

    await page.goto('/demo/storefront-preview/terms');
    await expect(page.locator('text=Terms of Service')).toBeVisible();
  });

  test('3. Multi-Item Shopping Cart and Simulated Checkout Flow', async ({ page }) => {
    // Start with a product in cart
    await page.goto('/demo/storefront-preview/hosting/prod_001');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add to Shopping Cart")');

    // Go to shopping cart
    await page.goto('/demo/storefront-preview/cart');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Shopping Cart')).toBeVisible();
    await expect(page.locator('text=Starter Web Hosting')).toBeVisible();
    await expect(page.locator('text=Order Summary')).toBeVisible();

    // Proceed to checkout
    const checkoutLink = page.locator('a:has-text("Proceed to Checkout")');
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();

    await expect(page).toHaveURL(/\/demo\/checkout/);
    await expect(page.locator('text=Order Summary')).toBeVisible();

    // Authorize simulated payment
    const confirmOrderBtn = page.locator('button:has-text("Confirm & Authorize Simulated Payment")');
    await expect(confirmOrderBtn).toBeVisible();
    await confirmOrderBtn.click();

    // Automated provisioning step
    await expect(page.locator('text=Automated Service Provisioning').first()).toBeVisible();
    await expect(page.locator('text=Allocating container & dedicated resources').first()).toBeVisible();

    // Service active
    await expect(page.locator('text=Service Active & Ready').first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Authenticated Customer Portal: Isolated Telemetry, Server Controls, Invoices, and Reseller Helpdesk Sync', async ({ page }) => {
    // 1. Customer Login simulation
    await page.goto('/demo/storefront-preview/client/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Client Portal Access')).toBeVisible();

    // Login as Alex Mercer
    const loginBtn = page.locator('button:has-text("Access Portal")').first();
    await loginBtn.click();

    // Arrive at Customer Dashboard
    await expect(page).toHaveURL(/\/demo\/storefront-preview\/client\/dashboard/);
    await expect(page.locator('text=Customer Client Portal')).toBeVisible();
    await expect(page.locator('text=Active Services')).toBeVisible();

    // 2. Client Services & Power Controls
    await page.goto('/demo/storefront-preview/client/services');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Active Services & Hosting Accounts')).toBeVisible();

    // Test reboot button
    const rebootBtn = page.locator('button:has-text("Reboot")').first();
    if (await rebootBtn.isVisible()) {
      await rebootBtn.click();
      await expect(page.locator('text=Reboot signal sent')).toBeVisible();
    }

    // 3. Client Domains
    await page.goto('/demo/storefront-preview/client/domains');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Registered Domains & DNS Management')).toBeVisible();

    // 4. Client Invoices & Simulated Payment
    await page.goto('/demo/storefront-preview/client/invoices');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Billing History & Invoices')).toBeVisible();

    // 5. Client Support Tickets: Open Ticket & Check Reseller Synchronization
    await page.goto('/demo/storefront-preview/client/tickets');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Support Desk & Inquiries')).toBeVisible();

    // Open ticket
    const openTicketBtn = page.locator('button:has-text("Open Support Ticket")');
    await openTicketBtn.click();

    const subjectInput = page.locator('input[placeholder*="DNS configuration assistance"]');
    await subjectInput.fill('Need assistance configuring DKIM TXT record');

    const descTextarea = page.locator('textarea[placeholder*="Provide detailed context"]');
    await descTextarea.fill('Please verify our DKIM TXT record syntax for automated email delivery.');

    await page.click('button:has-text("Submit Ticket")');
    await expect(page.locator('text=Support ticket opened successfully')).toBeVisible();

    // 6. Verify Ticket appears in Reseller Dashboard
    await page.goto('/demo/tickets');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Need assistance configuring DKIM TXT record')).toBeVisible();
  });
});
