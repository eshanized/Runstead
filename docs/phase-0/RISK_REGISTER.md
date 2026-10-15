# Runstead — Phase 0: Project Risk Register

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Document Baseline**: Phase 0 (October 2026)  
> **Scoring Methodology**: Likelihood (Low: 1, Med: 2, High: 3) × Impact (Low: 1, Med: 2, High: 3, Critical: 4)  
> **Severity Matrix**: Score 1–3: Low | 4–6: Medium | 7–9: High | 10–12: Critical

---

## 1. Risk Register Summary & Prioritization

| Risk ID | Category | Risk Description | Likelihood | Impact | Severity | Current Status | Target Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-SEC-01** | Dependency & Supply Chain | 26 dependency vulnerabilities reported by `npm audit` resolved via Next.js 15 LTS and overrides. | Low (1) | Low (1) | **Low (1)** | Mitigated / Closed | Phase 1 (Closed) |
| **RSK-ROA-01** | Roadmap Ambiguity | Unapproved 32-phase roadmap reconstruction requiring formal stakeholder approval. | High (3) | High (3) | **High (9)** | Open | Phase 0 Gate |
| **RSK-DAT-01** | Tenant Isolation | Client-side `localStorage` lacks database engine RLS guarantees for multi-tenancy. | Low (1) | Low (1) | **Low (1)** | Mitigated / Closed | Phase 2 (Closed) |
| **RSK-AUT-01** | Auth & Permissions | Reseller staff and customer authentication currently simulated without bcrypt sessions. | High (3) | High (3) | **High (9)** | Open | Phase 3 |
| **RSK-FIN-01** | Payment Correctness | Invoices and payments are client-side simulations without Stripe webhook idempotency. | Medium (2) | Critical (4) | **High (8)** | Open | Phase 4 |
| **RSK-PRV-01** | Provisioning Safety | 4-step provisioning pipeline simulates cgroup/hypervisor calls without live failure recovery. | Medium (2) | High (3) | **Medium (6)** | Open | Phase 12, 14 |
| **RSK-DNS-01** | Domain & DNS Safety | DNS zone mutations are not synchronized to external authoritative root/Anycast clusters. | Medium (2) | High (3) | **Medium (6)** | Open | Phase 17 |
| **RSK-DAT-02** | Data Loss & Recovery | Browser storage reset clears demo tenant records; no RPO/RTO backup infrastructure exists. | High (3) | High (3) | **High (9)** | Open | Phase 27 |
| **RSK-OBS-01** | Observability Gaps | Server-side API routes lack centralized APM telemetry and distributed tracing. | Medium (2) | Medium (2) | **Medium (4)** | Open | Phase 12 |
| **RSK-EXT-01** | Third-Party Limits | GitHub REST API unauthenticated rate limits (60 req/hr) may throttle progress dashboard. | Low (1) | Medium (2) | **Low (2)** | Mitigated | Phase 0 (Mitigated) |

---

## 2. Detailed Risk Profiles & Action Plans

### RSK-SEC-01: Dependency & Supply Chain Vulnerabilities (Mitigated / Closed)
- **Description**: Running `npm audit` previously revealed 26 vulnerabilities (4 moderate, 21 high, 1 critical), including Next.js Image Optimizer DoS, React Server Component deserialization issues, PostCSS arbitrary file read advisories, and transitive AST recursion DoS.
- **Supporting Evidence**: All 26 vulnerabilities resolved in Phase 1; clean `npm audit` report (exit code 0, 0 vulnerabilities) documented in [`docs/phase-1/DEPENDENCY_AUDIT.md`](file:///docs/phase-1/DEPENDENCY_AUDIT.md) and [`docs/phase-1/TEST_RESULTS.md`](file:///docs/phase-1/TEST_RESULTS.md). Automated CI gate enforced in [`.github/workflows/ci.yml`](file:///home/snigdha/Downloads/hostings/.github/workflows/ci.yml).
- **Impact**: Mitigated. Runtime is patched against all public RCE, SSRF, and DoS vectors; automated CI gate prevents regressions.
- **Mitigation Strategy**: Executed dedicated dependency upgrade and security hardening sprint in Phase 1: upgraded to Next.js 15.5.28 Maintenance LTS, upgraded PostCSS to 8.5.30, and applied scoped overrides for transitive packages (`braces`, `nanoid`, `cross-spawn`, `flatted`, `glob`, `ws`).
- **Responsible Role**: Security Lead / Core Backend Engineer.
- **Current Status**: **Mitigated / Closed** (Phase 1).
- **Verification Evidence for Closure**: Clean `npm audit` report with 0 vulnerabilities across all severities, verified lockfile reproducible via `npm ci`, and 100% passing tests (52/52 unit, 25/25 Playwright E2E).

### RSK-ROA-01: Canonical 32-Phase Roadmap Ambiguity
- **Description**: An exhaustive repository search confirmed that a 32-phase roadmap breakdown was never committed into this repository prior to Phase 0. While a 6-milestone, 42-task model was recovered, the 32-phase plan is reconstructed and requires stakeholder approval.
- **Supporting Evidence**: `git log --all --grep="phase" -i` returns 0 hits for 32-phase specifications; [`docs/ROADMAP_32_PHASES.md`](file:///docs/ROADMAP_32_PHASES.md) flagged as `PROPOSED — NOT APPROVED`.
- **Impact**: Risk of misalignment between engineering execution and executive expectations for Phases 1–31.
- **Mitigation Strategy**: Formally document the discovery in [`docs/phase-0/OPEN_DECISIONS.md`](file:///docs/phase-0/OPEN_DECISIONS.md) (Decision OD-001) and request stakeholder review before kicking off Phase 1.
- **Responsible Role**: Product Manager / Lead Architect.
- **Verification Evidence for Closure**: Signed stakeholder approval recorded on ADR-0005.

### RSK-DAT-01: Multi-Tenant Data Isolation Absence in Demo State (Mitigated / Closed)
- **Description**: The original demo application stored data purely in browser `localStorage` without database-engine level isolation guarantees across multiple reseller organizations.
- **Supporting Evidence**: Phase 2 established a production PostgreSQL 18.6 schema with 19 tables, versioned migrations via Prisma (`prisma/migrations/20261015081632_init_phase2_schema/migration.sql`), transaction-scoped session variable `app.current_tenant_id`, and `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` policies across all 18 tenant-owned tables. Verified by 25 automated integration tests in [`tests/db-rls.test.ts`](file:///tests/db-rls.test.ts) executed under non-superuser role `runstead_app`.
- **Impact**: Mitigated. Database engine enforces row-level multi-tenant boundaries at the SQL layer with fail-closed default behavior.
- **Mitigation Strategy**: Established versioned PostgreSQL migrations with RLS policies, `withTenantContext` transaction helper, and continuous integration verification in [`.github/workflows/ci.yml`](file:///home/snigdha/Downloads/hostings/.github/workflows/ci.yml).
- **Responsible Role**: Lead Database Architect / Security Engineer.
- **Current Status**: **Mitigated / Closed** (Phase 2).
- **Verification Evidence for Closure**: 25/25 passing automated multi-tenant RLS integration tests in [`tests/db-rls.test.ts`](file:///tests/db-rls.test.ts) and clean CI workflow job `database-rls-tests`.

### RSK-AUT-01: Unauthenticated Reseller & Customer Sessions
- **Description**: The current demo platform allows arbitrary navigation between platform admin, reseller settings, and customer portal without validating hashed credentials or session tokens.
- **Supporting Evidence**: [`components/client-portal/client-portal-layout.tsx`](file:///components/client-portal/client-portal-layout.tsx) allows instant switching between demo customers.
- **Impact**: Inability to restrict sensitive financial and administrative actions in production.
- **Mitigation Strategy**: Implement HTTP-only session cookies with BCrypt password hashing and RBAC middleware in Phase 3.
- **Responsible Role**: Identity & Security Engineer.
- **Verification Evidence for Closure**: Automated Playwright authentication tests verifying 401/403 redirects on protected routes.

### RSK-FIN-01: Payment Idempotency & Reconciliation Gaps
- **Description**: Order payments and invoice marks are simulated in local client state. No cryptographic signature verification or double-billing prevention exists.
- **Supporting Evidence**: [`lib/demo/workflows.ts`](file:///lib/demo/workflows.ts) mutates invoice status in local memory.
- **Impact**: Potential duplicate billing, charge loss, or uncollected revenue in commercial operations.
- **Mitigation Strategy**: Implement Stripe Checkout, HMAC-SHA256 webhook verification, and UUIDv4 idempotency keys in Phase 4.
- **Responsible Role**: FinTech / Payments Engineer.
- **Verification Evidence for Closure**: Automated Stripe webhook retry tests confirming 0 duplicate invoice settlements.

### RSK-EXT-01: GitHub Telemetry Rate-Limiting (Mitigated)
- **Description**: Unauthenticated requests to the GitHub REST API are limited to 60 req/hr per IP.
- **Supporting Evidence**: [`lib/github/client.ts`](file:///lib/github/client.ts).
- **Impact**: Potential failure of `/progress` dashboard for high-traffic public visitors.
- **Mitigation Strategy**: Fully mitigated in Phase 0 via in-memory caching (10-minute TTL) and automatic fallback to canonical static snapshot ([`lib/github/snapshot.ts`](file:///lib/github/snapshot.ts)). Unit tests `19`, `20`, and `22` in `tests/github-integration.test.ts` pass with 100% verification.
- **Current Status**: **Mitigated / Verified**.
