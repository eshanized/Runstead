import { test, expect } from '@playwright/test';

test.describe('Runstead Public Progress Dashboard & Roadmap Suite', () => {
  test('1. Public progress page renders with branding, GitHub repository link, and freshness indicator', async ({
    page,
  }) => {
    await page.goto('/progress');
    await expect(page).toHaveTitle(/Live Development Progress & Roadmap/);

    // Verify header and branding
    await expect(page.locator('h1:has-text("Runstead Development Progress")')).toBeVisible();
    await expect(page.locator('text=eshanized/Runstead').first()).toBeVisible();

    // Verify freshness indicator
    await expect(page.locator('text=Last refreshed:').first()).toBeVisible();

    // Verify external GitHub link
    const repoLink = page.locator('a[href*="github.com/eshanized/Runstead"]').first();
    await expect(repoLink).toBeVisible();
  });

  test('2. Main progress overview cards display task completion and effort metrics', async ({
    page,
  }) => {
    await page.goto('/progress');

    // Overall task completion card
    await expect(page.locator('text=Task Completion').first()).toBeVisible();
    await expect(page.locator('text=tasks remaining across all open milestones').first()).toBeVisible();

    // Effort-weighted card
    await expect(page.locator('text=Effort-Weighted Progress').first()).toBeVisible();
    await expect(page.locator('text=Coverage:').first()).toBeVisible();

    // Work in progress card
    await expect(page.locator('text=Work In Progress').first()).toBeVisible();

    // Estimated delivery window card
    await expect(page.locator('text=Estimated Delivery Window').first()).toBeVisible();
  });

  test('3. Milestone stages roadmap renders all 6 evolutionary stages with progress bars', async ({
    page,
  }) => {
    await page.goto('/progress');

    // Milestones tab is default
    await expect(page.locator('text=Evolutionary Milestones').first()).toBeVisible();
    await expect(page.locator('text=M1: Foundation & Reseller Architecture').first()).toBeVisible();
    await expect(page.locator('text=M2: Core Platform & Business Workflows').first()).toBeVisible();
    await expect(page.locator('text=M3: Customer Experience & Storefront').first()).toBeVisible();
    await expect(page.locator('text=M4: Provisioning & Automation Engine').first()).toBeVisible();
    await expect(page.locator('text=M5: Domain Commerce & DNS Network').first()).toBeVisible();
    await expect(page.locator('text=M6: Security, Enterprise & Release Readiness').first()).toBeVisible();
  });

  test('4. Active tasks tab allows search and status filtering', async ({ page }) => {
    await page.goto('/progress');

    // Click Active Tasks tab
    await page.click('button[role="tab"]:has-text("Active Tasks")');
    await expect(page.locator('input[placeholder*="Search issues"]').first()).toBeVisible();

    // Type search query
    await page.fill('input[placeholder*="Search issues"]', 'cPanel');
    await expect(page.locator('text=Build production cPanel & WHM integration connector driver').first()).toBeVisible();

    // Filter by blocked status
    await page.fill('input[placeholder*="Search issues"]', '');
    await page.selectOption('select[aria-label="Filter tasks by status"]', 'blocked');
    await expect(page.locator('text=Integrate authoritative Anycast DNS cluster synchronization').first()).toBeVisible();
  });

  test('5. Completed Deliverables tab shows evidence-backed verified features', async ({
    page,
  }) => {
    await page.goto('/progress');

    // Switch to Completed tab
    await page.click('button[role="tab"]:has-text("Completed")');
    await expect(page.locator('text=Verified Completed Deliverables').first()).toBeVisible();

    // Evidence links visible
    await expect(page.locator('text=Evidence:').first()).toBeVisible();
    await expect(page.locator('text=Verified Complete').first()).toBeVisible();
  });

  test('6. Release Readiness tab displays evidence-backed checks and blocker telemetry', async ({
    page,
  }) => {
    await page.goto('/progress');

    // Switch to Readiness tab
    await page.click('button[role="tab"]:has-text("Release Readiness")');
    await expect(page.locator('text=Progress vs. Release Readiness').first()).toBeVisible();

    // Verify checks
    await expect(page.locator('text=Unit & E2E Tests').first()).toBeVisible();
    await expect(page.locator('text=TypeScript & Linting').first()).toBeVisible();
    await expect(page.locator('text=Production Build').first()).toBeVisible();
    await expect(page.locator('text=Security Audit').first()).toBeVisible();
    await expect(page.locator('text=GitHub Actions CI').first()).toBeVisible();
  });

  test('7. Git Activity tab renders commit log', async ({ page }) => {
    await page.goto('/progress');

    // Switch to Git Activity tab
    await page.click('button[role="tab"]:has-text("Git Activity")');
    await expect(page.locator('text=Live GitHub Activity').first()).toBeVisible();
    await expect(page.locator('text=Eshan Roy').first()).toBeVisible();
  });

  test('8. Homepage displays compact DevelopmentSummary component linking to /progress', async ({
    page,
  }) => {
    await page.goto('/');

    // Check development summary banner
    await expect(page.locator('text=Live Public Roadmap').first()).toBeVisible();
    await expect(page.locator('text=Current Stage:').first()).toBeVisible();
    await expect(page.locator('text=Roadmap Progress').first()).toBeVisible();

    // Click CTA
    const exploreBtn = page.locator('a:has-text("Explore Live Progress")').first();
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // Verify redirected to /progress
    await expect(page).toHaveURL(/\/progress/);
    await expect(page.locator('h1:has-text("Runstead Development Progress")')).toBeVisible();
  });

  test('9. Navigation menu includes Progress link', async ({ page }) => {
    await page.goto('/');
    const navLink = page.locator('header nav a[href="/progress"]').first();
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/progress/);
  });

  test('10. Mobile viewport responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/progress');

    // Verify header renders well on mobile
    await expect(page.locator('h1:has-text("Runstead Development Progress")')).toBeVisible();
    await expect(page.locator('text=Task Completion').first()).toBeVisible();

    // Mobile tabs are scrollable or selectable
    await expect(page.locator('button[role="tab"]:has-text("Roadmap")').first()).toBeVisible();
  });
});
