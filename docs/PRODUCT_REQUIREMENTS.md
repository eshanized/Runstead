# Runstead — Product Requirements Baseline

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Document Status**: Baseline Specification (Phase 0)  
> **Requirement Schema**: Stable IDs (`FR-xxx`, `NFR-xxx`, `SEC-xxx`, `OPS-xxx`, `REL-xxx`)

---

## 1. Functional Requirements (FR)

### 1.1 Tenant & Business Account Management

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-TEN-001** | **Multi-Tenant Account Creation**: System shall allow new reseller businesses to register, select a subscription plan tier, and instantiate an isolated workspace. | Core SaaS model for Tonmoy Infrastructure. | P0 | Automated E2E test + unit tests | None | **Verified (Demo)**: [`app/demo/launch/page.tsx`](file:///app/demo/launch/page.tsx), [`tests/e2e/demo-journeys.spec.ts`](file:///tests/e2e/demo-journeys.spec.ts) (Journey 2). |
| **FR-TEN-002** | **Tenant Business Settings**: Reseller can configure company name, legal entity, currency, tax rates, contact email, and branding colors. | Allows customized commercial operations. | P0 | Unit tests + UI validation | FR-TEN-001 | **Verified (Demo)**: [`app/demo/settings/page.tsx`](file:///app/demo/settings/page.tsx), [`lib/demo/store.tsx`](file:///lib/demo/store.tsx). |
| **FR-TEN-003** | **Platform Operator Fleet Visibility**: Fleet console shall aggregate all active reseller tenants, plan limits, MRR, and node usage. | Fleet oversight for Tonmoy Infrastructure. | P1 | Playwright E2E journey | FR-TEN-001 | **Verified (Demo)**: [`app/demo/platform-admin/page.tsx`](file:///app/demo/platform-admin/page.tsx), [`tests/e2e/demo-journeys.spec.ts`](file:///tests/e2e/demo-journeys.spec.ts) (Journey 10). |

### 1.2 Customer CRM & Staff Authorization

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-CRM-001** | **Customer Record Management**: Create, view, search, filter, and edit customer accounts with profile fields and status flags. | Essential customer directory for resellers. | P0 | Unit suite `tests/workflows.test.ts` | FR-TEN-001 | **Verified (Demo)**: [`app/demo/customers/page.tsx`](file:///app/demo/customers/page.tsx), [`tests/selectors.test.ts`](file:///tests/selectors.test.ts). |
| **FR-CRM-002** | **Referential Safe Soft-Archival**: Deleting a customer must soft-archive the record to preserve historical invoices and audit logs. | Prevents broken relational joins and legal ledger invalidation. | P0 | Unit suite `tests/workflows.test.ts` | FR-CRM-001 | **Verified (Demo)**: [`tests/workflows.test.ts`](file:///tests/workflows.test.ts) ("Customer Workflow: create, update, archive"). |
| **FR-STF-001** | **Role-Based Staff Access (RBAC)**: Support roles (Admin, Billing, Support, Viewer) restricting sensitive settings and destructive actions. | Protects reseller business security. | P1 | Automated middleware tests | FR-TEN-001 | **Simulated**: Roles defined in [`lib/demo/types.ts`](file:///lib/demo/types.ts); server authorization pending Phase 2. |

### 1.3 Product Catalog, Orders & Checkout

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-CAT-001** | **Multi-Cycle Pricing Catalog**: Support shared, VPS, domain, and add-on products with monthly, annual, and biennial cycles. | Supports industry standard billing intervals. | P0 | Unit suite `tests/workflows.test.ts` | FR-TEN-001 | **Verified (Demo)**: [`app/demo/products/page.tsx`](file:///app/demo/products/page.tsx). |
| **FR-CAT-002** | **Resource Quota Specification**: Products must define CPU, RAM, disk storage, and monthly bandwidth quota limits. | Enforces provisioning parameters upstream. | P1 | Selector validation | FR-CAT-001 | **Verified (Demo)**: [`lib/demo/seed-data.ts`](file:///lib/demo/seed-data.ts). |
| **FR-ORD-001** | **Order State Machine**: Orders transition through explicit states (`awaiting_payment` → `paid` → `provisioning` → `active` or `canceled`). | Guarantees clear order progression. | P0 | Unit suite `tests/workflows.test.ts` | FR-CAT-001, FR-CRM-001 | **Verified (Demo)**: [`tests/workflows.test.ts`](file:///tests/workflows.test.ts) ("Order & Provisioning Lifecycle"). |
| **FR-ORD-002** | **Multi-Item Shopping Cart**: Support multi-item checkout combining hosting plans, domain registrations, and add-on services. | Improves average order value and checkout UX. | P0 | Unit suite `tests/storefront.test.ts` | FR-ORD-001 | **Verified (Demo)**: [`app/demo/storefront-preview/cart/page.tsx`](file:///app/demo/storefront-preview/cart/page.tsx). |

### 1.4 Invoicing & Billing Lifecycle

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-BIL-001** | **Invoice Generation & Tax Calculations**: Compute line items, setup fees, regional tax rates, and total balances due. | Accurate accounting and customer billing. | P0 | Selector unit tests | FR-ORD-001 | **Verified (Demo)**: [`app/demo/invoices/page.tsx`](file:///app/demo/invoices/page.tsx), [`lib/demo/selectors.ts`](file:///lib/demo/selectors.ts). |
| **FR-BIL-002** | **Invoice Reconciliation (Paid/Refund/Void)**: Allow staff to mark paid, void unpaid invoices, or issue refunds with balance adjustments. | Critical financial lifecycle controls. | P0 | Unit suite `tests/workflows.test.ts` | FR-BIL-001 | **Verified (Demo)**: [`tests/workflows.test.ts`](file:///tests/workflows.test.ts) ("Invoice Workflow: pay, void, refund"). |
| **FR-BIL-003** | **Production Gateway Integration (Stripe)**: Tokenized customer card processing, automated recurring billing, and webhook reconciliation. | Real commercial transactions. | P0 | Integration tests with Stripe mock | FR-BIL-001 | **Planned (Horizon B / Phase 4)**: Documented in roadmap. |

### 1.5 Service Lifecycle & Provisioning Automation

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-PRV-001** | **Service Lifecycle State Machine**: Hosting services support state transitions (`Active`, `Suspended`, `Terminated`, `Pending`). | Operational management of client servers. | P0 | Unit suite `tests/workflows.test.ts` | FR-ORD-001 | **Verified (Demo)**: [`app/demo/services/page.tsx`](file:///app/demo/services/page.tsx), [`tests/workflows.test.ts`](file:///tests/workflows.test.ts). |
| **FR-PRV-002** | **Interactive 4-Step Provisioning Flow**: Hypervisor allocation, resource limits, DNS configuration, and automated SSL issuance. | End-to-end service delivery simulation. | P1 | Playwright E2E test | FR-PRV-001 | **Verified (Simulation)**: [`app/demo/checkout/page.tsx`](file:///app/demo/checkout/page.tsx). |
| **FR-PRV-003** | **Production Control Panel Connectors**: Concrete REST/API client for cPanel/WHM, Plesk, and DirectAdmin accounts. | Real server orchestration. | P0 | Integration tests against test server | FR-PRV-001 | **Planned (Horizon B / Phase 8+)**: Documented in roadmap. |

### 1.6 Domains, DNS & Support Workflows

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-DOM-001** | **Domain Availability & Registration**: Real-time domain search, TLD pricing, registration simulation, and transfer auth code input. | Core hosting cross-sell capability. | P0 | Selector unit tests | FR-CAT-001 | **Verified (Demo)**: [`app/demo/domains/page.tsx`](file:///app/demo/domains/page.tsx), [`tests/selectors.test.ts`](file:///tests/selectors.test.ts). |
| **FR-DNS-001** | **RFC DNS Zone Editor**: Add, edit, delete `A`, `AAAA`, `CNAME`, `MX` (with priority), `TXT`, `CAA` records with strict RFC syntax checking. | Domain management without leaving panel. | P0 | Workflow test + E2E test | FR-DOM-001 | **Verified (Demo)**: [`app/demo/dns/page.tsx`](file:///app/demo/dns/page.tsx), [`tests/e2e/demo-journeys.spec.ts`](file:///tests/e2e/demo-journeys.spec.ts). |
| **FR-SUP-001** | **Multi-Channel Ticketing Queue**: Filter by status and priority, open tickets, post customer replies, and add private internal staff notes. | Integrated customer service desk. | P0 | Workflow unit tests | FR-CRM-001 | **Verified (Demo)**: [`app/demo/tickets/page.tsx`](file:///app/demo/tickets/page.tsx), [`tests/workflows.test.ts`](file:///tests/workflows.test.ts). |

### 1.7 Storefront Customizer & Self-Service Portal

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-STF-001** | **WYSIWYG Storefront Visual Builder**: Customize brand name, colors, typography, header, footer, SEO metadata, and sections with live canvas. | Allows non-technical resellers to launch branded stores. | P0 | Storefront unit test suite | FR-TEN-002 | **Verified (Demo)**: [`app/demo/storefront/page.tsx`](file:///app/demo/storefront/page.tsx), [`tests/storefront.test.ts`](file:///tests/storefront.test.ts). |
| **FR-STF-002** | **Customer Self-Service Portal**: Authenticated customer view for services, unpaid invoices, support tickets, and profile settings. | Reduces support load via self-service. | P0 | Storefront unit test suite + E2E | FR-CRM-001 | **Verified (Demo)**: [`app/demo/storefront-preview/client/dashboard/page.tsx`](file:///app/demo/storefront-preview/client/dashboard/page.tsx). |

### 1.8 Delivery Telemetry & Public Governance

| ID | Title & Description | Rationale | Priority | Verification Method | Dependencies | Current Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-TEL-001** | **Live Delivery Progress Engine**: Dynamically query GitHub API to compute roadmap task completion, effort points, and milestone progress. | Transparent investor & customer telemetry. | P1 | Unit suites `progress-calculations.test.ts` | GitHub API | **Verified (Production Ready)**: [`app/progress/page.tsx`](file:///app/progress/page.tsx), [`lib/github/calculations.ts`](file:///lib/github/calculations.ts). |
| **FR-TEL-002** | **Defensible Delivery Forecasting**: Pure velocity math with uncertainty ranges (0.8x to 1.4x) and data sufficiency gating. | Prevents false completion promises. | P1 | Unit suite `forecasting.test.ts` | FR-TEL-001 | **Verified (Production Ready)**: [`lib/github/forecasting.ts`](file:///lib/github/forecasting.ts). |

---

## 2. Non-Functional Requirements (NFR)

| ID | Category | Target / Requirement | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-SEC-001** | **Security** | Zero committed secrets; all environment credentials loaded via environment variables and excluded from `.gitignore`. | Secret scan + git log inspection | **Verified** |
| **NFR-SEC-002** | **Tenant Isolation** | All database queries, caches, and background workers must enforce tenant ownership boundaries with zero cross-tenant leakage. | Automated RLS tests (Phase 2) | **Designed** |
| **NFR-PERF-001** | **Performance** | Next.js App Router first-load shared JavaScript bundle size must remain under 120 kB (currently 87.6 kB). | `npm run build` telemetry | **Verified** (87.6 kB) |
| **NFR-PERF-002** | **Performance** | Core web pages (Marketing, Storefront, Client Portal) must achieve LCP < 2.5s and TTFB < 600ms on standard 4G networks. | Playwright performance audit | **Designed** |
| **NFR-REL-001** | **Reliability** | Production API routes must return standardized JSON errors with stable HTTP status codes (400, 401, 403, 404, 429, 500). | Integration route tests | **Verified** ([`app/api/project-progress/route.ts`](file:///app/api/project-progress/route.ts)) |
| **NFR-TEST-001** | **Test Coverage** | 100% of defined business workflow mutations, selectors, and calculation engines must have automated test coverage. | Node test runner (`npm test`) | **Verified** (52/52 tests) |
| **NFR-A11Y-001** | **Accessibility** | All interactive modals, dropdowns, and form inputs must meet WCAG 2.1 Level AA keyboard navigation standards via Radix UI primitives. | Playwright accessibility checks | **Verified** |
| **NFR-MAINT-001**| **Maintainability**| Zero TypeScript compilation errors under strict mode (`tsconfig.json`) and 0 ESLint errors. | `npm run typecheck && npm run lint` | **Verified** |
