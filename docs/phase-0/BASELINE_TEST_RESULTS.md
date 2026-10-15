# Runstead — Phase 0.1: Baseline Test & Check Results

> **Target Repository**: `https://github.com/eshanized/Runstead`  
> **Timestamp**: October 15, 2026  
> **Environment**: Linux x86_64, Node.js v20+, Chromium `/usr/sbin/chromium`  
> **Committed Head**: `4482099` (`fix: all the ci and test errors`)

This document records the exact commands, execution logs, durations, and exit statuses for every engineering check executed during the Phase 0 audit.

---

## 1. Summary of Baseline Checks

| Check Name | Command | Exit Code | Result | Pre-Existing vs. Phase 0 |
| :--- | :--- | :--- | :--- | :--- |
| **Dependency Verification** | `npm ls --depth=0` | 0 | **PASS** | Pre-existing verified baseline |
| **Static Type Checking** | `npm run typecheck` | 0 | **PASS** | Pre-existing verified baseline |
| **Code Linting** | `npm run lint` | 0 | **PASS** (3 warnings) | Pre-existing verified baseline |
| **Unit & Workflow Tests** | `npm test` | 0 | **PASS** (52/52) | Pre-existing verified baseline |
| **Production Build** | `npm run build` | 0 | **PASS** (65/65) | Pre-existing verified baseline |
| **Playwright E2E Tests** | `npm run test:e2e` | 0 | **PASS** (25/25) | Pre-existing verified baseline |
| **Composite Fast Check** | `npm run check` | 0 | **PASS** | Added in Phase 0 |
| **Dependency Audit** | `npm audit` | 1 | **FAIL** (26 advisories) | Pre-existing dependency vulnerability state |

---

## 2. Check 1: Static Type Check (`npm run typecheck`)

- **Command**: `npm run typecheck` (`tsc --noEmit`)
- **Working Directory**: `/home/snigdha/Downloads/hostings`
- **Duration**: ~6.0 seconds
- **Exit Code**: `0`

### Output:
```text
npm notice run runstead@0.1.0 typecheck
npm notice run tsc --noEmit
```
*Result: 0 errors detected. Full compliance with strict TypeScript compiler options.*

---

## 3. Check 2: Linting (`npm run lint`)

- **Command**: `npm run lint` (`next lint`)
- **Duration**: ~3.0 seconds
- **Exit Code**: `0`

### Output:
```text
npm notice run runstead@0.1.0 lint
npm notice run next lint

./components/editor/panels/branding-panel.tsx
170:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./components/storefront/storefront-footer.tsx
47:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./components/storefront/storefront-navbar.tsx
84:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
```
*Result: 0 errors, 3 non-blocking warnings.*

---

## 4. Check 3: Unit and Workflow Test Suites (`npm test`)

- **Command**: `node --test --experimental-strip-types tests/*.test.ts`
- **Duration**: ~2.15 seconds
- **Exit Code**: `0`

### Test Suite Execution Breakdown:

1. **`tests/forecasting.test.ts` (8 tests)**:
   - ✔ 11. Handles tasks with missing completion dates safely without crash (2.38ms)
   - ✔ 12. Reopened task history: ignores closedAt date if task is currently open (0.48ms)
   - ✔ 13. Filters tasks closed outside of the observation window (0.53ms)
   - ✔ 14. Sparse historical velocity: returns isCalculable: false with clear reason (1.73ms)
   - ✔ 15. Scope growth: remaining effort updates when new tasks are added (0.99ms)
   - ✔ 16. Forecast calculation with uncertainty ranges (0.78ms)
   - ✔ 17. Forecast confidence reflects estimate coverage and blockers (0.72ms)
   - ✔ 18. Normalizes invalid GitHub issue payload safely without exceptions (1.18ms)

2. **`tests/github-integration.test.ts` (4 tests)**:
   - ✔ 19. Canonical snapshot generates valid, coherent progress response (5.47ms)
   - ✔ 20. Stale cache behavior: flags dataSource as snapshot or stale when fallback is used (1.60ms)
   - ✔ 21. Pagination and partial data handling: normalizes multiple batches cleanly (1.52ms)
   - ✔ 22. Server-side token handling: getProjectProgress executes and returns valid response (1621.59ms)

3. **`tests/progress-calculations.test.ts` (10 tests)**:
   - ✔ 1. Empty roadmap behavior: reports null completion instead of misleading 0% (10.34ms)
   - ✔ 2. Correct completed and total task counts (0.54ms)
   - ✔ 3. Correct treatment of open, closed, blocked, and reopened tasks (3.23ms)
   - ✔ 4. Pull request exclusion: ignores PR items from Issues API (0.75ms)
   - ✔ 5. Exclusion of issues without the roadmap label (0.75ms)
   - ✔ 6. Milestone-specific calculations (0.84ms)
   - ✔ 7. Correct effort-weighted progress (0.36ms)
   - ✔ 8. Missing and invalid estimates parsing (1.09ms)
   - ✔ 9. Partial estimate coverage calculation (2.30ms)
   - ✔ 10. Duplicate issue prevention in filterEligibleRoadmapTasks (1.26ms)

4. **`tests/seed-data.test.ts` (3 tests)**:
   - ✔ seedData contains all required state collections (1.72ms)
   - ✔ referential integrity between collections (0.86ms)
   - ✔ deterministic seed stability and no placeholder data leaks (0.31ms)

5. **`tests/selectors.test.ts` (9 tests)**:
   - ✔ searchCustomers matches name, email, company, or country (8.65ms)
   - ✔ filterCustomersByStatus filters correctly (0.68ms)
   - ✔ sortCustomers orders by field and direction (42.21ms)
   - ✔ paginate and totalPages behave accurately (7.14ms)
   - ✔ product search and filter (5.71ms)
   - ✔ order and service filtering (2.14ms)
   - ✔ domain search and deterministic availability check (0.78ms)
   - ✔ getDashboardStats derives consistent metric figures (3.97ms)
   - ✔ formatters format currency and dates accurately (34.77ms)

6. **`tests/storefront.test.ts` (9 tests)**:
   - ✔ Theme presets are strongly typed, distinct, and well-formed (2.04ms)
   - ✔ Default sections and pages are populated and valid (0.55ms)
   - ✔ isValidCustomSlug protects against route collisions and invalid characters (0.61ms)
   - ✔ sanitizeColor validates hex and returns fallback on invalid values (0.41ms)
   - ✔ migrateStorefrontConfig upgrades legacy state seamlessly without data loss (0.70ms)
   - ✔ Draft and publish lifecycle operations (0.48ms)
   - ✔ Cart lifecycle: add, update cycle, remove, and totals calculation (0.91ms)
   - ✔ Multi-item checkout workflow provisions services and domains atomically (1.76ms)
   - ✔ Customer portal actions: open ticket, reply, and pay invoice (0.96ms)

7. **`tests/workflows.test.ts` (9 tests)**:
   - ✔ Customer Workflow: create, update, and archive/delete (4.96ms)
   - ✔ Product Workflow: create, edit pricing, toggle availability, archive (1.46ms)
   - ✔ Order & Provisioning Lifecycle: checkout -> paid -> provisioning -> active service (3.08ms)
   - ✔ Service Lifecycle: suspend, restore, and cancellation actions (1.05ms)
   - ✔ Domain & DNS Workflow: simulated purchase, external connection, renewal, records (3.87ms)
   - ✔ Invoice Workflow: pay, void, and refund with payment records (1.13ms)
   - ✔ Ticket Workflow: create ticket, staff reply, internal note, status change (2.75ms)
   - ✔ SaaS Acquisition Launch & Platform Operator Synchronization (3.04ms)
   - ✔ Analytics Consistency after Workflows (1.89ms)

### Suite Summary:
```text
ℹ tests 52
ℹ suites 7
ℹ pass 52
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2156.442358
```

---

## 5. Check 4: Production Build (`npm run build`)

- **Command**: `next build`
- **Duration**: ~22.0 seconds
- **Exit Code**: `0`

### Build Summary:
- **Routes Generated**: 65 routes (Static: 55, SSG: 6, Dynamic: 4).
- **First Load Shared JS**: 87.6 kB.
- **Trace Output**: Clean compilation with 0 syntax or bundling errors.

---

## 6. Check 5: Playwright End-to-End Suite (`npm run test:e2e`)

- **Command**: `playwright test`
- **Browser**: Chromium `/usr/sbin/chromium`
- **Workers**: 1 (serial execution for deterministic state assertions)
- **Duration**: 51.5 seconds
- **Exit Code**: `0`

### Passed Journeys (25/25):
1. `tests/e2e/demo-journeys.spec.ts`:
   - ✔ 1. Marketing site navigation and pricing plan handoff to launch wizard (1.6s)
   - ✔ 2. SaaS Acquisition Journey: Plan -> Profile -> Brand -> Confirm -> Dashboard (1.3s)
   - ✔ 3. Reseller Dashboard Overview and Global Search (Ctrl+K) (1.3s)
   - ✔ 4. Customers Management: Filter, safe archive, and cross-module tabs (917ms)
   - ✔ 5. White-Label Storefront Preview and Interactive Checkout with Automated Provisioning (3.4s)
   - ✔ 6. Services Fleet Management: Inspect, Suspend, Restore, and Upgrade (978ms)
   - ✔ 7. Invoices Management: Details, line items, and mark paid workflow (828ms)
   - ✔ 8. DNS Management and RFC Record Validation (1.2s)
   - ✔ 9. Support Tickets: Open new ticket and staff response workflow (1.5s)
   - ✔ 10. Platform Operator Console: Tonmoy Infrastructure Fleet Operations (855ms)
   - ✔ 11. Credibility and Legal Pages (`/about`, `/privacy`, `/terms`) (920ms)

2. `tests/e2e/progress-dashboard.spec.ts`:
   - ✔ 1. Progress page renders with branding, GitHub repository link, and freshness indicator (861ms)
   - ✔ 2. Main progress overview cards display task completion and effort metrics (920ms)
   - ✔ 3. Milestone stages roadmap renders all 6 evolutionary stages with progress bars (942ms)
   - ✔ 4. Active tasks tab allows search and status filtering (1.3s)
   - ✔ 5. Completed Deliverables tab shows evidence-backed verified features (1.2s)
   - ✔ 6. Release Readiness tab displays evidence-backed checks and blocker telemetry (1.0s)
   - ✔ 7. Git Activity tab renders commit log (1.1s)
   - ✔ 8. Homepage displays compact DevelopmentSummary component linking to /progress (1.3s)
   - ✔ 9. Navigation menu includes Progress link (1.3s)
   - ✔ 10. Mobile viewport responsive layout (930ms)

3. `tests/e2e/storefront-experience.spec.ts`:
   - ✔ 1. Visual Builder, Viewport Toggles, Theme Switching, and Publish Semantics (3.6s)
   - ✔ 2. Multi-Page Storefront Catalog, Domain Marketplace, and Dynamic Pages (7.1s)
   - ✔ 3. Multi-Item Shopping Cart and Simulated Checkout Flow (5.4s)
   - ✔ 4. Customer Portal: Isolated Telemetry, Server Controls, Invoices, and Reseller Helpdesk Sync (6.6s)

---

## 7. Check 6: Dependency Security Audit (`npm audit`)

- **Command**: `npm audit`
- **Duration**: ~2.5 seconds
- **Exit Code**: `1`
- **Result**: 26 vulnerabilities identified (4 moderate, 21 high, 1 critical).
- **Critical CVE**: GHSA-9g9p-9gw9-jx7f, GHSA-h25m-26qc-wcjf in `next < 16.3.0-preview.10`.
- **High Severity CVEs**: `postcss`, `brace-expansion`, `cross-spawn`, `flatted`, `nanoid`, `ws`, `browserslist`.
- **Status**: Recorded as pre-existing risk `RSK-SEC-01` in [`docs/phase-0/RISK_REGISTER.md`](file:///docs/phase-0/RISK_REGISTER.md). Automatic remediation (`npm audit fix --force`) is intentionally avoided in Phase 0 to protect framework stability.
