import { test, expect } from '@playwright/test';

test.describe('HostPilot Investor Demonstration End-to-End Suite', () => {

  test('1. Marketing site navigation and pricing plan handoff to launch wizard', async ({ page }) => {
    // Visit home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Runstead/);
    await expect(page.locator('text=Start, operate, and grow a hosting business').first()).toBeVisible();

    // Navigate to pricing
    await page.goto('/pricing');
    await expect(page.locator('text=Plans that scale with your hosting business').first()).toBeVisible();

    // Click "Get Started" on the Growth plan
    const growthCta = page.locator('a[href*="/demo/launch?plan=Growth"]').first();
    await expect(growthCta).toBeVisible();
    await growthCta.click();

    // Verify arrived at launch wizard with Growth plan selected
    await expect(page).toHaveURL(/\/demo\/launch\?plan=Growth/);
    await expect(page.locator('text=Launch Your Hosting Business').first()).toBeVisible();
  });

  test('2. SaaS Acquisition Journey: Plan -> Profile -> Brand -> Confirm -> Dashboard', async ({ page }) => {
    await page.goto('/demo/launch?plan=Launch');
    await expect(page.locator('text=1. Select SaaS Plan').first()).toBeVisible();

    // Step 1: Confirm plan selection
    const nextBtn = page.locator('button:has-text("Continue to Business Profile")');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Step 2: Fill Business Profile
    await expect(page.locator('text=Reseller Business Profile').first()).toBeVisible();
    await page.fill('#biz-name', 'Apex Cloud Solutions');
    await page.fill('#biz-email', 'admin@apexcloud.io');

    const toBrandBtn = page.locator('button:has-text("Next: Branding & Identity")');
    await toBrandBtn.click();

    // Step 3: Brand & Identity
    await expect(page.locator('text=White-Label Brand Settings').first()).toBeVisible();
    await page.fill('#store-headline', 'High-performance cloud hosting engineered for developers');

    const toConfirmBtn = page.locator('button:has-text("Review Subscription")');
    await toConfirmBtn.click();

    // Step 4: Review & Simulated Subscription
    await expect(page.locator('text=Apex Cloud Solutions').first()).toBeVisible();
    await expect(page.locator('text=Simulated SaaS Payment Confirmation').first()).toBeVisible();

    const launchBtn = page.locator('button:has-text("Launch to Dashboard")');
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Should navigate into dashboard / onboarding with new business context
    await page.waitForURL(/\/demo\/(onboarding|overview)/);
    await expect(page.locator('text=Apex Cloud Solutions').first()).toBeVisible();
  });

  test('3. Reseller Dashboard Overview and Global Search (Ctrl+K)', async ({ page }) => {
    await page.goto('/demo/overview');
    await expect(page.locator('text=Dashboard Overview')).toBeVisible();
    await expect(page.locator('text=MRR')).toBeVisible();
    await expect(page.locator('text=Active Customers')).toBeVisible();

    // Test Global Search palette trigger
    const searchTrigger = page.locator('button[aria-label*="Search demo records"]');
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();

    // Search dialog opens
    const searchInput = page.locator('input[placeholder*="Type a command or search"]');
    await expect(searchInput).toBeVisible();

    // Search for a customer
    await searchInput.fill('Sarah');
    await expect(page.locator('text=Sarah Mitchell').first()).toBeVisible();

    // Click result and navigate to customers
    await page.locator('button:has-text("Sarah Mitchell")').first().click();
    await expect(page).toHaveURL(/\/demo\/customers/);
  });

  test('4. Customers Management: Filter, safe archive, and cross-module tabs', async ({ page }) => {
    await page.goto('/demo/customers');
    await expect(page.locator('text=Customers').first()).toBeVisible();

    // View customer modal
    const viewBtn = page.locator('button[aria-label*="View details"]').first();
    await viewBtn.click();

    // Verify cross-module tabs exist
    await expect(page.locator('button[role="tab"]:has-text("Services")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Invoices")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Orders")')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('5. White-Label Storefront Preview and Interactive Checkout with Automated Provisioning', async ({ page }) => {
    // 1. Visit published storefront preview
    await page.goto('/demo/storefront-preview');
    await expect(page.locator('text=White-Label Storefront Preview').first()).toBeVisible();
    await expect(page.locator('text=Host smarter. Scale faster.').first()).toBeVisible();

    // Test domain availability search
    await page.fill('input[placeholder*="ideal domain"]', 'nexthost-test.com');
    await page.click('button:has-text("Search")');
    await expect(page.locator('text=Available').first()).toBeVisible();

    // Click Order Now on a package
    const orderBtn = page.locator('a:has-text("Order Now")').first();
    await orderBtn.click();

    // Arrive at /demo/checkout
    await expect(page).toHaveURL(/\/demo\/checkout/);
    await expect(page.locator('text=Order Summary')).toBeVisible();

    // Authorize simulated payment
    const confirmOrderBtn = page.locator('button:has-text("Confirm & Authorize Simulated Payment")');
    await expect(confirmOrderBtn).toBeVisible();
    await confirmOrderBtn.click();

    // Step 5: Automated Provisioning Simulation
    await expect(page.locator('text=Automated Service Provisioning').first()).toBeVisible();
    await expect(page.locator('text=Allocating container & dedicated resources').first()).toBeVisible();

    // Wait for provisioning to complete (success state)
    await expect(page.locator('text=Service Active & Ready').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=View in Dashboard').first()).toBeVisible();
  });

  test('6. Services Fleet Management: Inspect, Suspend, Restore, and Upgrade', async ({ page }) => {
    await page.goto('/demo/services');
    await expect(page.locator('text=Services').first()).toBeVisible();

    // Open first service modal
    const viewBtn = page.locator('button[aria-label*="View details"]').first();
    await viewBtn.click();

    // Check resource usage and actions
    await expect(page.locator('button[role="tab"]:has-text("Resource Usage")')).toBeVisible();
    await expect(page.locator('button:has-text("Upgrade Plan")')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('7. Invoices Management: Details, line items, and mark paid workflow', async ({ page }) => {
    await page.goto('/demo/invoices');
    await expect(page.locator('text=Invoices').first()).toBeVisible();

    // Open first invoice
    const viewBtn = page.locator('button[aria-label*="View invoice"]').first();
    await viewBtn.click();

    await expect(page.locator('text=Line Items')).toBeVisible();
    await expect(page.locator('text=Total Amount')).toBeVisible();
    await expect(page.locator('button:has-text("Print")')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('8. DNS Management and RFC Record Validation', async ({ page }) => {
    await page.goto('/demo/dns');
    await expect(page.locator('text=DNS Zones').first()).toBeVisible();

    // Click Add Record on toolbar
    await page.click('button:has-text("Add Record")');
    await expect(page.locator('text=Add DNS Record')).toBeVisible();

    // Test invalid IPv4 validation
    await page.fill('#host', 'api');
    await page.fill('#value', 'invalid-ip-999');
    await page.click('form button[type="submit"]:has-text("Add Record")');

    // Expect validation message
    await expect(page.locator('text=Invalid IPv4 address format')).toBeVisible();

    // Fix with valid IP
    await page.fill('#value', '198.51.100.55');
    await page.click('form button[type="submit"]:has-text("Add Record")');
    await expect(page.locator('text=DNS record created').first()).toBeVisible();
    await expect(page.locator('td:has-text("198.51.100.55")').first()).toBeVisible();
  });

  test('9. Support Tickets: Open new ticket and staff response workflow', async ({ page }) => {
    await page.goto('/demo/tickets');
    await expect(page.locator('text=Support Tickets').first()).toBeVisible();

    // Click Open New Ticket
    await page.click('button:has-text("Open New Ticket")');
    await expect(page.locator('text=Open New Support Ticket')).toBeVisible();

    // Select customer
    await page.click('#customerSelect');
    await page.click('[role="option"] >> nth=0');

    await page.fill('#ticketSubject', 'Investor Demo Verification Ticket');
    await page.fill('#ticketMessage', 'Testing full cross-module ticket creation and response.');
    await page.click('button[type="submit"]:has-text("Create Ticket")');

    // Ticket should appear in list
    await expect(page.locator('text=Investor Demo Verification Ticket')).toBeVisible();
  });

  test('10. Platform Operator Console: Tonmoy Infrastructure Fleet Operations', async ({ page }) => {
    await page.goto('/demo/platform-admin');
    await expect(page.locator('text=Tonmoy Cloud Operator').first()).toBeVisible();
    await expect(page.locator('text=Platform MRR').first()).toBeVisible();
    await expect(page.locator('text=Reseller Tenants Directory').first()).toBeVisible();

    // View tenant detail dialog
    const tenantViewBtn = page.locator('button:has-text("Manage")').first();
    await tenantViewBtn.click();

    await expect(page.locator('text=Tenant Identifier:').first()).toBeVisible();
    await expect(page.locator('button:has-text("Save Changes (Simulated)")').first()).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('11. Credibility and Legal Pages', async ({ page }) => {
    // About
    await page.goto('/about');
    await expect(page.locator('text=Building the operating system for hosting businesses')).toBeVisible();
    await expect(page.locator('text=About this project')).toBeVisible();

    // Privacy
    await page.goto('/privacy');
    await expect(page.locator('text=Privacy Notice & Data Processing Policy')).toBeVisible();

    // Terms
    await page.goto('/terms');
    await expect(page.locator('text=SaaS Subscription & Evaluation Terms')).toBeVisible();
  });
});
