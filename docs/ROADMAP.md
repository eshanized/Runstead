# Runstead Project Roadmap & Evidence Inventory

> **Canonical Public Source of Truth**: [https://github.com/eshanized/Runstead](https://github.com/eshanized/Runstead)  
> **Last Updated**: October 2026  
> **Methodology**: Strict evidence-based accounting distinguishing **Implemented**, **Verified**, **Released**, **Planned**, and **Estimated**.

---

## 1. Roadmap Architecture & Milestone Overview

Runstead's development is organized into six evolutionary milestones aligning our business operating system with upcoming real infrastructure connectors:

| Milestone | Stage & Focus | Status | Target Scope |
| :--- | :--- | :--- | :--- |
| **M1: Foundation & Reseller Architecture** | Core tenant data model, seed state, acquisition launch wizard, platform admin console | Verified (Demo) | 8 tasks (26 pts) |
| **M2: Core Platform & Business Workflows** | CRM, product catalog, order machine, recurring invoices, support ticket queue | Verified (Demo) | 8 tasks (28 pts) |
| **M3: Customer Experience & Storefront** | Storefront customizer, customer portal, domain lookup, shopping cart checkout | Verified (Demo) | 7 tasks (24 pts) |
| **M4: Provisioning & Automation Engine** | Service lifecycle, simulated 4-step provisioning, upstream cPanel/WHM connectors | In Progress | 6 tasks (29 pts) |
| **M5: Domain Commerce & DNS Network** | RFC DNS zone editor, registrar API connector abstraction, ACME SSL automation | In Progress | 6 tasks (27 pts) |
| **M6: Security, Enterprise & Release Readiness** | Live progress dashboard, CI/CD pipeline, production database adapter, v1.0 release | In Progress | 7 tasks (31 pts) |

---

## 2. Milestone 1: Foundation & Reseller Architecture

### Implemented & Verified Capabilities
1. **Tenant Data Modeling & State Engine**
   - *Description*: Typed multi-tenant demo state store supporting customer records, catalog, orders, DNS zones, and invoices with localStorage persistence.
   - *Evidence*: `lib/demo/store.tsx`, `lib/demo/types.ts`, `lib/demo/seed-data.ts`.
   - *Verification*: Automated unit suite `tests/seed-data.test.ts` (3/3 passing), `tests/selectors.test.ts` (9/9 passing).
   - *Status*: Verified.

2. **Reseller SaaS Acquisition Flow**
   - *Description*: Multi-step tenant launch wizard selecting plan tier, defining company profile, authorizing simulated billing, and provisioning tenant workspace.
   - *Evidence*: `app/demo/launch/page.tsx`, `app/demo/onboarding/page.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("SaaS Acquisition Launch & Platform Operator Synchronization"), Playwright test `tests/e2e/demo-journeys.spec.ts`.
   - *Status*: Verified.

3. **Multi-Tenant Platform Operator Console**
   - *Description*: Global fleet management console giving Runstead operators visibility into reseller tenants, MRR contributions, plan quotas, and system health.
   - *Evidence*: `app/demo/platform-admin/page.tsx`.
   - *Verification*: Playwright test `tests/e2e/demo-journeys.spec.ts` (Journey 10: Platform Operator Console).
   - *Status*: Verified.

4. **Global Command Palette (⌘K / Ctrl+K)**
   - *Description*: Instant keyboard-driven search indexing customers, products, orders, services, invoices, and support tickets.
   - *Evidence*: `components/demo/command-search.tsx`.
   - *Verification*: Playwright test `tests/e2e/demo-journeys.spec.ts` (Journey 3: Reseller Dashboard & Global Search).
   - *Status*: Verified.

---

## 3. Milestone 2: Core Platform & Business Workflows

### Implemented & Verified Capabilities
1. **Customer CRM & Lifecycle Management**
   - *Description*: Customer search, filtering by active/suspended/archived, pagination, profile edits, and safe soft-archival preserving referential integrity.
   - *Evidence*: `app/demo/customers/page.tsx`, `lib/demo/store.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Customer Workflow: create, update, and archive/delete"), `tests/selectors.test.ts`.
   - *Status*: Verified.

2. **Multi-Cycle Product Catalog**
   - *Description*: Shared hosting, VPS, domain, and add-on product management with monthly, annual, biennial pricing and resource quota limits.
   - *Evidence*: `app/demo/products/page.tsx`, `lib/demo/store.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Product Workflow: create, edit pricing, toggle availability, archive").
   - *Status*: Verified.

3. **Order State Machine**
   - *Description*: Order workflow transitioning from `awaiting_payment` → `paid` → `provisioning` → `active`, with cancellation handling.
   - *Evidence*: `app/demo/orders/page.tsx`, `lib/demo/store.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Order & Provisioning Lifecycle").
   - *Status*: Verified.

4. **Invoice Breakdown & Payment Reconciliation**
   - *Description*: Tax rate calculations, line item generation, printable invoice modals, simulated Mark Paid, Refund, and Void actions.
   - *Evidence*: `app/demo/invoices/page.tsx`, `lib/demo/store.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Invoice Workflow: pay, void, and refund with payment records").
   - *Status*: Verified.

5. **Multi-Channel Support Ticketing**
   - *Description*: Queue filtered by priority and status, customer association, staff replies, internal notes, and resolution workflows.
   - *Evidence*: `app/demo/tickets/page.tsx`, `lib/demo/store.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Ticket Workflow: create ticket, staff reply, internal note, status change").
   - *Status*: Verified.

6. **Executive Analytics & KPI Telemetry**
   - *Description*: Recharts visualizations of 6-month revenue curves, customer acquisition, service distributions, and renewal vs churn ratios.
   - *Evidence*: `app/demo/analytics/page.tsx`, `app/demo/overview/page.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Analytics Consistency after Workflows").
   - *Status*: Verified.

---

## 4. Milestone 3: Customer Experience & Storefront

### Implemented & Verified Capabilities
1. **White-Label Storefront Visual Builder**
   - *Description*: Real-time WYSIWYG customizer for company branding, themes, typography, custom pages, and header/footer styling with viewport toggles.
   - *Evidence*: `app/demo/storefront/page.tsx`, `components/editor/*`.
   - *Verification*: `tests/storefront.test.ts` (9/9 passing tests).
   - *Status*: Verified.

2. **Customer-Facing Published Storefront Preview**
   - *Description*: Public-facing multi-page storefront rendering active theme colors, domain lookup, catalog pricing, and custom pages.
   - *Evidence*: `app/demo/storefront-preview/*`.
   - *Verification*: Playwright test `tests/e2e/storefront-experience.spec.ts`.
   - *Status*: Verified.

3. **Self-Service Client Portal**
   - *Description*: Authenticated customer portal for viewing active hosting services, paying unpaid invoices, submitting support tickets, and managing profile.
   - *Evidence*: `app/demo/storefront-preview/client/*`.
   - *Verification*: `tests/storefront.test.ts` ("Customer portal actions: open ticket, reply, and pay invoice").
   - *Status*: Verified.

4. **Multi-Item Shopping Cart & Checkout**
   - *Description*: Cart lifecycle supporting cycle switching, add-on selection, tax breakdown, and atomic multi-product checkout.
   - *Evidence*: `app/demo/storefront-preview/cart/page.tsx`, `app/demo/checkout/page.tsx`.
   - *Verification*: `tests/storefront.test.ts` ("Cart lifecycle: add, update cycle, remove", "Multi-item checkout workflow").
   - *Status*: Verified.

---

## 5. Milestone 4: Provisioning & Automation Engine

### Implemented & Verified (Simulation)
1. **Service Lifecycle State Machine**
   - *Description*: Atomic lifecycle operations (`Suspend`, `Restore`, `Upgrade Plan`, `Cancel`) with resource quota tracking (CPU, RAM, Disk, Bandwidth).
   - *Evidence*: `app/demo/services/page.tsx`, `lib/demo/store.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Service Lifecycle: suspend, restore, and cancellation actions").
   - *Status*: Verified (Simulation).

2. **Interactive 4-Step Provisioning Pipeline**
   - *Description*: Hypervisor allocation, cgroup resource bounding, DNS configuration, and automated SSL issuance with retry handling.
   - *Evidence*: `app/demo/checkout/page.tsx`.
   - *Verification*: `tests/e2e/demo-journeys.spec.ts` (Journey 5: Storefront Preview & Provisioning).
   - *Status*: Verified (Simulation).

### Planned Work
3. **Production cPanel / WHM Connector**
   - *Scope*: Real REST client connecting to WHM XML-API / UAPI for account creation, quota assignment, suspension, and termination.
   - *Estimate*: 8 effort points.
   - *Status*: Planned.

4. **Plesk & DirectAdmin Provider Integrations**
   - *Scope*: Driver architecture supporting Plesk REST API and DirectAdmin CMD_API.
   - *Estimate*: 5 effort points.
   - *Status*: Planned.

5. **Asynchronous Background Task & Retry Queue**
   - *Scope*: Persistent job queue (BullMQ / Redis or PostgreSQL LISTEN) handling retries, backoffs, and dead-letter queues.
   - *Estimate*: 8 effort points.
   - *Status*: Planned.

6. **Webhooks Outbound Delivery Engine**
   - *Scope*: HMAC-signed webhook notifications dispatched to reseller endpoints on service lifecycle events.
   - *Estimate*: 5 effort points.
   - *Status*: Planned.

---

## 6. Milestone 5: Domain Commerce & DNS Network

### Implemented & Verified Capabilities
1. **RFC-Compliant DNS Zone Editor**
   - *Description*: Full record management supporting `A`, `AAAA`, `CNAME`, `MX` (with priority), `TXT`, and `CAA` records with RFC validation and TTL controls.
   - *Evidence*: `app/demo/dns/page.tsx`, `lib/demo/store.tsx`.
   - *Verification*: `tests/workflows.test.ts` ("Domain & DNS Workflow"), `tests/e2e/demo-journeys.spec.ts` (Journey 8).
   - *Status*: Verified.

2. **Domain Availability & Registration Workflow**
   - *Description*: Fast search with deterministic availability results, TLD pricing, registration simulation, and external domain nameserver mapping.
   - *Evidence*: `app/demo/domains/page.tsx`.
   - *Verification*: `tests/selectors.test.ts` ("domain search and deterministic availability check").
   - *Status*: Verified (Simulation).

### Planned Work
3. **Upstream Registrar Connectors (ResellerClub, Enom, Namecheap)**
   - *Scope*: Concrete API integration to check real EPP domain availability, register domains, and update nameservers.
   - *Estimate*: 8 effort points.
   - *Status*: Planned.

4. **Automated ACME / Let's Encrypt SSL Manager**
   - *Scope*: DNS-01 and HTTP-01 challenge automation for instant wildcard SSL generation and certificate renewal.
   - *Estimate*: 5 effort points.
   - *Status*: Planned.

5. **Authoritative Anycast DNS Cluster Integration**
   - *Scope*: API integration with PowerDNS / Cloudflare to synchronize customer DNS zones to global edges.
   - *Estimate*: 8 effort points.
   - *Status*: Planned.

---

## 7. Milestone 6: Security, Enterprise & Release Readiness

### Implemented & Verified Capabilities
1. **Live GitHub-Powered Progress Dashboard & Forecast Engine**
   - *Description*: Dynamic `/progress` page measuring actual eligible GitHub roadmap tasks, milestone completion, effort-weighted progress, defensible velocity forecasting, and release readiness.
   - *Evidence*: `app/progress/page.tsx`, `app/api/project-progress/route.ts`, `lib/github/*`.
   - *Verification*: Unit tests `tests/progress-calculations.test.ts`, `tests/forecasting.test.ts`, integration tests `tests/github-integration.test.ts`.
   - *Status*: Verified.

2. **Automated CI/CD Workflow**
   - *Description*: GitHub Actions workflow executing type checking, ESLint, unit test suites, production build, and Playwright verification.
   - *Evidence*: `.github/workflows/ci.yml`.
   - *Status*: Verified.

3. **Homepage Development Summary Component**
   - *Description*: Compact live summary component embedded on the marketing homepage linking directly to `/progress`.
   - *Evidence*: `components/marketing/development-summary.tsx`, `app/page.tsx`.
   - *Status*: Verified.

### Planned Work
4. **Production PostgreSQL / Supabase Persistence Adapter**
   - *Scope*: Migrate demo state store to server-side PostgreSQL schema with Prisma ORM and row-level tenant security (RLS).
   - *Estimate*: 8 effort points.
   - *Status*: Planned.

5. **Stripe Billing & Webhook Reconciliation**
   - *Scope*: Stripe Checkout, Customer Portal, and webhook handler for automated invoice settlement and failed payment handling.
   - *Estimate*: 5 effort points.
   - *Status*: Planned.

6. **Role-Based Access Control (RBAC) & Audit Log Engine**
   - *Scope*: Granular permissions (Admin, Support Agent, Billing Clerk, Auditor) with tamper-evident audit logs.
   - *Estimate*: 5 effort points.
   - *Status*: Planned.

7. **Production Launch & Security Hardening (v1.0 Release)**
   - *Scope*: Penetration testing, rate limiting, security headers, dependency vulnerability audit, and tagged v1.0 release.
   - *Estimate*: 5 effort points.
   - *Status*: Planned.

---

## 8. Definition of Done & Verification Standards

To prevent premature claims of completion:
- **Implemented**: Source code, UI, or backend module exists and functions in code.
- **Verified**: Unit tests, integration tests, or end-to-end browser journeys pass with 0 errors in CI.
- **Configured on GitHub**: Trackable issue exists on `eshanized/Runstead` with milestone, category label, and effort points.
- **Released**: Code has been tagged and published as a GitHub release.
- **Planned**: Documented deliverable with explicit acceptance criteria scheduled for an upcoming milestone.
