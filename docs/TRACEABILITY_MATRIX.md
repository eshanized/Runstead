# Runstead — Requirements & Architecture Traceability Matrix

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Document Baseline**: Phase 0 (October 2026)  
> **Status**: Comprehensive Lifecycle Traceability

---

## 1. Traceability Methodology & Audit Rules

This matrix establishes verifiable bidirectional traceability connecting product requirements (`FR-*`, `NFR-*`), roadmap phases (Phase 0 through Phase 31), architectural decisions (ADRs), code locations, test suites, risk register entries, and current implementation statuses.

### Status Definitions:
- **Verified**: Fully implemented in source code and checked by a passing automated test suite in CI.
- **Verified (Demo)**: Fully functional within the client-side demonstration and tested via unit or browser journeys.
- **Simulated**: Visual UI and state progression exist, but real external backend calls (Stripe, hypervisor, registrar) are simulated.
- **Planned / Unimplemented**: Documented architectural deliverable assigned to an upcoming roadmap phase.

---

## 2. Requirements Traceability Matrix

| Requirement ID | Requirement Title | Phase | Primary Code Location | Verification Suite / Test | ADR Link | Risk Link | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-TEN-001** | Multi-Tenant Workspace Launch & Persistence | Phase 0 / 2 | [`prisma/schema.prisma`](file:///prisma/schema.prisma), [`app/demo/launch/page.tsx`](file:///app/demo/launch/page.tsx) | `tests/db-rls.test.ts` (25 tests), `tests/workflows.test.ts`, `tests/e2e/demo-journeys.spec.ts` (Journey 2) | [ADR-0003](file:///docs/adr/0003-multi-tenant-isolation-model.md), [ADR-0007](file:///docs/adr/0007-orm-and-production-persistence-technology-selection.md) | [RSK-DAT-01](file:///docs/phase-0/RISK_REGISTER.md) | **Verified (Phase 2)** |
| **FR-TEN-002** | Tenant Business & Brand Settings | Phase 0 / 2 | [`app/demo/settings/page.tsx`](file:///app/demo/settings/page.tsx) | `tests/selectors.test.ts` (Currency & formatters), `tests/workflows.test.ts` | [ADR-0003](file:///docs/adr/0003-multi-tenant-isolation-model.md) | None | **Verified (Demo)** |
| **FR-TEN-003** | Fleet Operator Visibility Console | Phase 0 / 2 | [`app/demo/platform-admin/page.tsx`](file:///app/demo/platform-admin/page.tsx) | `tests/e2e/demo-journeys.spec.ts` (Journey 10) | [ADR-0003](file:///docs/adr/0003-multi-tenant-isolation-model.md) | None | **Verified (Demo)** |
| **FR-CRM-001** | Customer Record Management | Phase 0 / 6 | [`app/demo/customers/page.tsx`](file:///app/demo/customers/page.tsx) | `tests/workflows.test.ts` ("Customer Workflow: create, update, archive"), `tests/selectors.test.ts` | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | None | **Verified (Demo)** |
| **FR-CRM-002** | Safe Referential Soft-Archival | Phase 0 / 6 | [`lib/demo/workflows.ts`](file:///lib/demo/workflows.ts) (`archiveCustomer`) | `tests/workflows.test.ts` ("Customer Workflow: create, update, and archive/delete") | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | None | **Verified (Demo)** |
| **FR-STF-001** | Role-Based Staff Access (RBAC) | Phase 3 | [`lib/demo/types.ts`](file:///lib/demo/types.ts), [`app/demo/settings/page.tsx`](file:///app/demo/settings/page.tsx) | Unimplemented (Server authorization pending) | [ADR-0003](file:///docs/adr/0003-multi-tenant-isolation-model.md) | [RSK-AUT-01](file:///docs/phase-0/RISK_REGISTER.md) | **Simulated** |
| **FR-CAT-001** | Multi-Cycle Product Catalog | Phase 0 / 7 | [`app/demo/products/page.tsx`](file:///app/demo/products/page.tsx) | `tests/workflows.test.ts` ("Product Workflow: create, edit pricing, toggle availability") | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | None | **Verified (Demo)** |
| **FR-CAT-002** | Resource Quota Specification | Phase 0 / 7 | [`lib/demo/seed-data.ts`](file:///lib/demo/seed-data.ts) | `tests/seed-data.test.ts` (Referential integrity & quota fields) | None | None | **Verified (Demo)** |
| **FR-ORD-001** | Order State Machine | Phase 0 / 8 | [`app/demo/orders/page.tsx`](file:///app/demo/orders/page.tsx) | `tests/workflows.test.ts` ("Order & Provisioning Lifecycle") | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | None | **Verified (Demo)** |
| **FR-ORD-002** | Multi-Item Shopping Cart | Phase 0 / 8 | [`app/demo/storefront-preview/cart/page.tsx`](file:///app/demo/storefront-preview/cart/page.tsx) | `tests/storefront.test.ts` ("Cart lifecycle: add, update cycle, remove", "Multi-item checkout") | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | None | **Verified (Demo)** |
| **FR-BIL-001** | Invoice Breakdown & Tax Logic | Phase 0 / 5 | [`app/demo/invoices/page.tsx`](file:///app/demo/invoices/page.tsx) | `tests/workflows.test.ts` ("Invoice Workflow: pay, void, refund"), `tests/selectors.test.ts` | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | None | **Verified (Demo)** |
| **FR-BIL-002** | Payment Reconciliation (Refund/Void) | Phase 0 / 5 | [`lib/demo/workflows.ts`](file:///lib/demo/workflows.ts) | `tests/workflows.test.ts` ("Invoice Workflow: pay, void, refund with payment records") | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | [RSK-FIN-01](file:///docs/phase-0/RISK_REGISTER.md) | **Verified (Demo)** |
| **FR-BIL-003** | Production Stripe Gateway | Phase 4 | Unimplemented | Unimplemented (Stripe testbed scheduled Phase 4) | [ADR-0004](file:///docs/adr/0004-provider-adapter-architecture.md) | [RSK-FIN-01](file:///docs/phase-0/RISK_REGISTER.md) | **Planned** |
| **FR-PRV-001** | Service Lifecycle State Machine | Phase 0 / 12 | [`app/demo/services/page.tsx`](file:///app/demo/services/page.tsx) | `tests/workflows.test.ts` ("Service Lifecycle: suspend, restore, and cancellation actions") | [ADR-0004](file:///docs/adr/0004-provider-adapter-architecture.md) | [RSK-PRV-01](file:///docs/phase-0/RISK_REGISTER.md) | **Verified (Demo)** |
| **FR-PRV-002** | 4-Step Provisioning Simulation | Phase 0 / 12 | [`app/demo/checkout/page.tsx`](file:///app/demo/checkout/page.tsx) | `tests/e2e/demo-journeys.spec.ts` (Journey 5) | [ADR-0004](file:///docs/adr/0004-provider-adapter-architecture.md) | [RSK-PRV-01](file:///docs/phase-0/RISK_REGISTER.md) | **Verified (Simulation)** |
| **FR-PRV-003** | Upstream cPanel / WHM Connector | Phase 14 | Unimplemented | Planned for Phase 14 WHM integration suite | [ADR-0004](file:///docs/adr/0004-provider-adapter-architecture.md) | [RSK-PRV-01](file:///docs/phase-0/RISK_REGISTER.md) | **Planned** |
| **FR-DOM-001** | Domain Availability & Purchase | Phase 0 / 16 | [`app/demo/domains/page.tsx`](file:///app/demo/domains/page.tsx) | `tests/selectors.test.ts` ("domain search and deterministic availability check") | [ADR-0004](file:///docs/adr/0004-provider-adapter-architecture.md) | None | **Verified (Demo)** |
| **FR-DNS-001** | RFC DNS Zone Editor | Phase 0 / 17 | [`app/demo/dns/page.tsx`](file:///app/demo/dns/page.tsx) | `tests/workflows.test.ts` ("Domain & DNS Workflow"), `tests/e2e/demo-journeys.spec.ts` (Journey 8) | [ADR-0004](file:///docs/adr/0004-provider-adapter-architecture.md) | [RSK-DNS-01](file:///docs/phase-0/RISK_REGISTER.md) | **Verified (Demo)** |
| **FR-SUP-001** | Multi-Channel Ticketing Queue | Phase 0 / 10 | [`app/demo/tickets/page.tsx`](file:///app/demo/tickets/page.tsx) | `tests/workflows.test.ts` ("Ticket Workflow: create ticket, staff reply, internal note") | [ADR-0002](file:///docs/adr/0002-state-management-and-persistence-strategy.md) | None | **Verified (Demo)** |
| **FR-STF-001** | WYSIWYG Storefront Visual Editor | Phase 0 / 9 | [`app/demo/storefront/page.tsx`](file:///app/demo/storefront/page.tsx) | `tests/storefront.test.ts` (9 tests), `tests/e2e/storefront-experience.spec.ts` (Journey 1) | [ADR-0001](file:///docs/adr/0001-runtime-and-application-framework.md) | None | **Verified (Demo)** |
| **FR-STF-002** | Customer Self-Service Client Portal | Phase 0 / 6 | [`app/demo/storefront-preview/client/*`](file:///app/demo/storefront-preview/client) | `tests/storefront.test.ts` ("Customer portal actions"), `tests/e2e/storefront-experience.spec.ts` | [ADR-0001](file:///docs/adr/0001-runtime-and-application-framework.md) | None | **Verified (Demo)** |
| **FR-TEL-001** | Live GitHub Progress Telemetry | Phase 0 | [`app/progress/page.tsx`](file:///app/progress/page.tsx), [`lib/github/calculations.ts`](file:///lib/github/calculations.ts) | `tests/progress-calculations.test.ts` (10 tests), `tests/e2e/progress-dashboard.spec.ts` (10 tests) | None | [RSK-EXT-01](file:///docs/phase-0/RISK_REGISTER.md) | **Verified (Production Ready)** |
| **FR-TEL-002** | Defensible Velocity Forecasting | Phase 0 | [`lib/github/forecasting.ts`](file:///lib/github/forecasting.ts) | `tests/forecasting.test.ts` (8 tests) | None | None | **Verified (Production Ready)** |
| **NFR-SEC-002** | Multi-Tenant Row-Level Security | Phase 2 | [`prisma/migrations/20261015081632_init_phase2_schema/migration.sql`](file:///prisma/migrations/20261015081632_init_phase2_schema/migration.sql), [`lib/db/client.ts`](file:///lib/db/client.ts) | `tests/db-rls.test.ts` (25/25 tests pass under restricted `runstead_app` role) | [ADR-0003](file:///docs/adr/0003-multi-tenant-isolation-model.md), [ADR-0007](file:///docs/adr/0007-orm-and-production-persistence-technology-selection.md) | [RSK-DAT-01](file:///docs/phase-0/RISK_REGISTER.md) | **Verified (Phase 2)** |
| **NFR-TEST-001**| 100% Automated Test Passing | Phase 0 / 2 | [`tests/`](file:///tests) | `npm test` (77/77 pass: 52 unit + 25 RLS), `npm run test:e2e` (25/25 pass) | None | None | **Verified** |
| **NFR-MAINT-001**| Zero TypeScript / ESLint Errors | Phase 0 / 2 | [`tsconfig.json`](file:///tsconfig.json), [`.eslintrc.json`](file:///.eslintrc.json) | `npm run typecheck` (0 errors), `npm run lint` (0 errors) | [ADR-0001](file:///docs/adr/0001-runtime-and-application-framework.md) | None | **Verified** |
| **NFR-PERF-001**| Sub-120kB First Load Shared JS | Phase 0 / 2 | Next.js compilation | `npm run build` telemetry (103 kB shared first-load JS) | [ADR-0001](file:///docs/adr/0001-runtime-and-application-framework.md) | None | **Verified** (103 kB) |
