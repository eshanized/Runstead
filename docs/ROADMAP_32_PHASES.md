# Runstead — 32-Phase Roadmap Contract & Evolution Specification

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Repository**: [`https://github.com/eshanized/Runstead`](https://github.com/eshanized/Runstead)  
> **Phases Count**: 32 Phases (Phase 0 through Phase 31)  
> **Document Baseline**: Phase 0 (October 2026)  
> **Status**: **Phase 0 Authoritative; Phases 1–31 PROPOSED — NOT APPROVED**

---

## 1. Roadmap Discovery Audit & Governance Statement

### 1.1 Exhaustive Repository Search Performed
In accordance with **Phase 0 Non-Negotiable Rule 2.2 (Preserve the Existing 32-Phase Agreement)**, an exhaustive audit of all available local git data was conducted:
1. `git log -E --grep="phase" -i` across all 207 historical commits.
2. `git log -S "Phase" --oneline`, `git log -S "32" --oneline`, `git log -S "Phase 0" --oneline`.
3. Inspection of all git branches (`git branch -a`), tags (`git tag -l`), and reflogs (`git reflog -20`).
4. Full working tree regex inspection (`git grep -i "phase"` and `git grep -i "32"`).
5. Detailed inspection of existing project documentation ([`docs/ROADMAP.md`](file:///docs/ROADMAP.md), [`docs/GITHUB_INTEGRATION.md`](file:///docs/GITHUB_INTEGRATION.md), [`scripts/setup-github-roadmap.sh`](file:///scripts/setup-github-roadmap.sh), and [`lib/github/snapshot.ts`](file:///lib/github/snapshot.ts)).

### 1.2 Evidence Discovered
The repository contained the following authoritative historical structures:
- **A 6-Milestone, 42-Task Delivery Model**: Documented in [`docs/ROADMAP.md`](file:///docs/ROADMAP.md) and tracked on GitHub via [`scripts/setup-github-roadmap.sh`](file:///scripts/setup-github-roadmap.sh) across:
  - `M1: Foundation & Reseller Architecture` (8 tasks, 26 pts)
  - `M2: Core Platform & Business Workflows` (8 tasks, 28 pts)
  - `M3: Customer Experience & Storefront` (7 tasks, 24 pts)
  - `M4: Provisioning & Automation Engine` (6 tasks, 29 pts)
  - `M5: Domain Commerce & DNS Network` (6 tasks, 27 pts)
  - `M6: Security, Enterprise & Release Readiness` (7 tasks, 31 pts)
- **A 3-Phase Strategic Roadmap**: Documented in [`app/about/page.tsx`](file:///app/about/page.tsx) (`Phase 1: Business SaaS`, `Phase 2: Automation`, `Phase 3: Infrastructure`).
- **A 4-Stage Evolution Timeline**: Documented in [`app/platform/hosting/page.tsx`](file:///app/platform/hosting/page.tsx) (`Today: Business SaaS`, `Near-term: Connected Hosting`, `Mid-term: Managed Services`, `Long-term: Owned Infrastructure`).

### 1.3 Finding & Strict Non-Fabrication Rule
**No file, branch, or commit containing a pre-existing 32-phase (Phase 0 through Phase 31) breakdown existed in the repository prior to Phase 0.**

In strict compliance with **Non-Negotiable Rule 2.2**:
- We do **not** invent a replacement roadmap and claim it was previously agreed upon.
- We document Phase 0 as the active, authoritative foundation phase.
- We present Phases 1 through 31 as a **clearly labeled `PROPOSED — NOT APPROVED` reconstruction** that synthesizes the 6 milestones, 42 GitHub roadmap tasks, and 3 strategic horizons into 32 logical, sequential, dependency-checked phases.
- We do **not** declare the canonical 32-phase roadmap baseline complete until Tonmoy Infrastructure stakeholders review and formally approve this proposal or recover an external specification document.

---

## 2. High-Level Horizon & Milestone Mapping

The 32 phases map directly across the three core platform horizons:

| Horizon | Description | Phase Span | Target Milestones |
| :--- | :--- | :--- | :--- |
| **Foundation** | Audit, engineering controls, specifications & architecture | **Phase 0** | Project Readiness Baseline |
| **Horizon A** | Hosting-Business Operating Platform (SaaS, CRM, Catalog, Billing, Storefronts) | **Phases 1 – 11** | M1, M2, M3 |
| **Horizon B** | Automation & Integration Layer (cPanel, Plesk, EPP Registrars, DNS edges, Stripe) | **Phases 12 – 21** | M4, M5, M6 |
| **Horizon C** | Owned Infrastructure Platform (Hypervisors, Containers, BIND clusters, Backups) | **Phases 22 – 31** | Long-Term Infrastructure |

---

## 3. Phase Specifications (Phase 0 through Phase 31)

### Phase 0: Foundation, Specification & Project Readiness
- **Status**: **ACTIVE / ACCEPTED**
- **Objective**: Establish a reliable, evidence-backed foundation, engineering controls, audit records, and reproducible checks for all 32 phases.
- **Scope**: Codebase audit, requirements baseline, architecture specifications, data model, security model, definition of done, development workflow, ADRs, risk register, and baseline verification.
- **Requirements Addressed**: All baseline governance standards (`NFR-TEST-001`, `NFR-MAINT-001`, `NFR-SEC-001`).
- **Prerequisites**: Access to local repository and tools.
- **Deliverables**: Complete `docs/` suite, `.env.example`, `npm run check`/`validate` scripts, audit reports, baseline test logs.
- **Verification Methods**: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
- **Acceptance Criteria**: Working tree clean, all automated checks pass, 0 fabrication, all 18 exit criteria addressed.
- **Known Risks**: Pre-existing dependency advisories (`RSK-SEC-01`); unapproved 32-phase roadmap requiring formal approval.
- **Definition of Completion**: Completion report written with evidence and Phase 0 acceptance checklist signed off.
- **Downstream Phases Affected**: All phases (Phases 1–31).

---

### Phase 1: Dependency Hardening & Security Baseline
- **Status**: **ACTIVE / ACCEPTED**
- **Objective**: Resolve critical and high dependency advisories identified in Phase 0 audit without breaking existing Next.js routes.
- **Scope**: Upgrade safe dependencies, migrate to Next.js 15.5.28 Maintenance LTS, apply audited scoped overrides, configure automated security scanning in CI (`npm audit --audit-level=high`), configure Dependabot.
- **Requirements Addressed**: `SEC-001`, `RSK-SEC-01`.
- **Prerequisites**: Phase 0.
- **Deliverables**: Hardened `package.json` & `package-lock.json`, zero critical/high CVEs, CI security audit workflow step, `.github/dependabot.yml`, `docs/phase-1/` documentation suite.
- **Verification Methods**: `npm audit` (0 vulnerabilities), `npm run typecheck` (pass), `npm run lint` (pass), `npm test` (52/52 pass), `npm run build` (65/65 routes), `npm run test:e2e` (25/25 pass).
- **Acceptance Criteria**: `npm audit` returns 0 vulnerabilities across all levels; all 52 unit tests and 25 Playwright tests pass; CI fails on high/critical findings.
- **Downstream Phases Affected**: Phase 2, Phase 3.

---

### Phase 2: Server-Side PostgreSQL Schema & Multi-Tenant RLS
- **Status**: **ACTIVE / ACCEPTED**
- **Objective**: Establish a production-grade relational PostgreSQL database schema with Row-Level Security (RLS) guaranteeing strict multi-tenant isolation.
- **Scope**: Prisma ORM schema definition, versioned SQL migrations, fail-closed tenant isolation RLS policies, connection pooling and tenant context abstraction, safe idempotent seed tooling, and automated PostgreSQL integration tests.
- **Requirements Addressed**: `FR-TEN-001`, `NFR-SEC-002`, `ADR-0002`, `ADR-0003`, `ADR-0007`, `OD-002`.
- **Prerequisites**: Phase 1.
- **Deliverables**: `prisma/schema.prisma` (19 tables), `prisma/migrations/20261015081632_init_phase2_schema/migration.sql`, `lib/db/client.ts` (`withTenantContext` helper), `lib/db/seed.ts` & `prisma/seed.ts`, `tests/db-rls.test.ts` (25 integration tests), `.github/workflows/ci.yml` (`database-rls-tests` job), complete `docs/phase-2/` documentation suite.
- **Verification Methods**: Automated database integration tests (`npm run test:db`) verifying cross-tenant query rejection under restricted role `runstead_app`; full suite regression tests (`npm test`, `npm run build`, `npm run test:e2e`).
- **Acceptance Criteria**: RLS policies prevent Tenant A from reading, inserting, updating, or deleting Tenant B records under all CRUD operations; zero cross-tenant foreign-key references; fail-closed behavior on missing or malformed tenant context.
- **Downstream Phases Affected**: Phases 3–11.

---

### *THE FOLLOWING PHASES 3 THROUGH 31 ARE PROPOSED — NOT APPROVED*

### Phase 3: Staff Identity, Authentication & RBAC Engine
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Implement production authentication and role-based access control for reseller staff and platform operators.
- **Scope**: HTTP-only secure cookies, session management, BCrypt password hashing, MFA, RBAC permission middleware.
- **Requirements Addressed**: `FR-STF-001`, `FR-TEN-003`, `SEC-002`.
- **Prerequisites**: Phase 2.
- **Deliverables**: Auth route handlers, password reset flow, session guard middleware, RBAC test suite.
- **Verification Methods**: Unit tests for password hashing; Playwright tests for unauthorized route redirection.
- **Acceptance Criteria**: Unauthenticated or unauthorized users are blocked from admin routes with 401/403 status codes.
- **Downstream Phases Affected**: Phases 4–11.

### Phase 4: Production Stripe Billing & Webhook Reconciliation
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Connect real payment processing to replace simulated checkout and invoice payments.
- **Scope**: Stripe Checkout sessions, Customer Portal integration, webhook signature verification, payment idempotency.
- **Requirements Addressed**: `FR-BIL-001`, `FR-BIL-002`, `FR-BIL-003`.
- **Prerequisites**: Phase 2, Phase 3.
- **Deliverables**: Stripe API client, webhook route handler (`/api/webhooks/stripe`), payment ledger repository.
- **Verification Methods**: Stripe CLI webhook simulation tests; idempotent charge retry tests.
- **Acceptance Criteria**: Invoices automatically transition to `paid` upon verified webhook receipt; replay attempts are rejected.
- **Downstream Phases Affected**: Phase 5, Phase 6.

### Phase 5: Automated Recurring Invoicing & Subscription Engine
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Implement automated recurring billing cycles (monthly, annual, biennial) with tax and line-item generation.
- **Scope**: Recurring invoice scheduler, prorated calculations, tax rate rules, overdue notices.
- **Requirements Addressed**: `FR-BIL-001`, `FR-CAT-001`.
- **Prerequisites**: Phase 4.
- **Deliverables**: Recurring billing worker, PDF invoice generator, automated notification dispatch.
- **Verification Methods**: Time-advancing billing calculation unit tests.
- **Acceptance Criteria**: Recurring invoices are generated exactly on cycle due date with correct subtotal, tax, and credits.
- **Downstream Phases Affected**: Phase 6, Phase 7.

### Phase 6: Customer CRM & Client Organization Portal
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Deliver production customer lifecycle management and dedicated client portal authentication.
- **Scope**: Customer profile directory, organization sub-accounts, billing contacts, client self-service portal.
- **Requirements Addressed**: `FR-CRM-001`, `FR-CRM-002`, `FR-STF-002`.
- **Prerequisites**: Phase 2, Phase 3.
- **Deliverables**: Production client portal routes, profile update endpoints, safe soft-archival enforcement.
- **Verification Methods**: Automated E2E journey verifying customer login, profile edit, and invoice payment.
- **Acceptance Criteria**: Customers can manage their services, view invoices, and update billing details securely.
- **Downstream Phases Affected**: Phases 7–11.

### Phase 7: Multi-Cycle Product Catalog & Resource Quota Engine
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Productionize product catalog management with dynamic pricing, setup fees, and resource quota boundaries.
- **Scope**: Shared, VPS, Domain, and Addon product types; multi-currency pricing; quota limit validation.
- **Requirements Addressed**: `FR-CAT-001`, `FR-CAT-002`.
- **Prerequisites**: Phase 2.
- **Deliverables**: Product management API, catalog cache layer, quota validator.
- **Verification Methods**: Unit tests checking pricing calculations and quota boundary violations.
- **Acceptance Criteria**: Resellers can create, update, and retire products without breaking existing subscriptions.
- **Downstream Phases Affected**: Phases 8, 9.

### Phase 8: Order Processing State Machine & Checkout Engine
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Connect the multi-item shopping cart and checkout directly to persistent orders and payment intents.
- **Scope**: Multi-item cart, domain add-ons, atomic order placement, state transitions (`awaiting_payment` → `paid` → `provisioning`).
- **Requirements Addressed**: `FR-ORD-001`, `FR-ORD-002`.
- **Prerequisites**: Phase 4, Phase 7.
- **Deliverables**: Atomic checkout API route, order state machine reducer, checkout E2E tests.
- **Verification Methods**: Playwright checkout journeys verifying atomic database transactions.
- **Acceptance Criteria**: Order creation atomically reserves inventory/domain and creates unpaid invoice.
- **Downstream Phases Affected**: Phases 9, 12.

### Phase 9: White-Label Storefront Productionization & Custom Domains
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Allow resellers to publish custom-branded storefronts to custom root domains and subdomains.
- **Scope**: Wildcard subdomain routing, custom domain CNAME verification, edge SSL certificate provisioning.
- **Requirements Addressed**: `FR-STF-001`, `NFR-PERF-002`.
- **Prerequisites**: Phase 2, Phase 8.
- **Deliverables**: Edge routing middleware, dynamic domain resolver, custom domain onboarding wizard.
- **Verification Methods**: Multi-domain mock routing tests; storefront theme rendering assertions.
- **Acceptance Criteria**: Storefront renders reseller-configured themes, typography, and products at custom hostnames.
- **Downstream Phases Affected**: Phase 10.

### Phase 10: Multi-Channel Support Ticket Queue & SLA Manager
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Implement production helpdesk ticketing with customer/staff threads, internal notes, and SLA timers.
- **Scope**: Inbound ticket creation, staff assignment, private notes, file attachments, email-to-ticket ingestion.
- **Requirements Addressed**: `FR-SUP-001`.
- **Prerequisites**: Phase 2, Phase 6.
- **Deliverables**: Ticket API endpoints, WebSocket/SSE live message updates, attachment storage integration.
- **Verification Methods**: E2E helpdesk ticket lifecycle tests (creation → reply → resolution).
- **Acceptance Criteria**: Internal staff notes are strictly excluded from client portal API payloads.
- **Downstream Phases Affected**: Phase 11.

### Phase 11: Business Analytics, Financial Telemetry & MRR Reporting
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Replace simulated analytics with real-time financial reporting, MRR calculations, and churn metrics.
- **Scope**: Daily financial snapshot aggregation, cohort retention curves, revenue forecasting, CSV data exports.
- **Requirements Addressed**: `FR-TEN-003`, `FR-TEL-001`.
- **Prerequisites**: Phase 4, Phase 5.
- **Deliverables**: Analytics calculation cron, Recharts telemetry components, secure export API.
- **Verification Methods**: Mathematical accuracy tests comparing raw invoice ledger sums to analytics outputs.
- **Acceptance Criteria**: MRR, ARPU, and churn metrics match double-entry accounting records with 0 discrepancies.
- **Downstream Phases Affected**: Horizon B phases.

---

### *HORIZON B: AUTOMATION & INTEGRATION LAYER (PHASES 12 – 21)*

### Phase 12: Asynchronous Job Queue & Workflow Orchestration Core
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Establish the persistent background job queue for infrastructure provisioning and external webhooks.
- **Scope**: BullMQ / Redis worker architecture, exponential backoffs, idempotency checks, dead-letter queues (DLQ).
- **Requirements Addressed**: `ADR-0004`, `NFR-REL-001`.
- **Prerequisites**: Phase 2.
- **Deliverables**: Job worker service, retry scheduler, queue monitoring dashboard.
- **Verification Methods**: Failure injection tests verifying automatic retry and dead-letter escalation.
- **Acceptance Criteria**: Transient network drops do not lose provisioning jobs; failures are visibly surfaced to staff.
- **Downstream Phases Affected**: Phases 13–21.

### Phase 13: Standardized Provider Adapter Driver Interface
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Implement the generic TypeScript driver contracts for hosting providers and registrars.
- **Scope**: `HostingProviderDriver`, `DomainRegistrarDriver`, `DNSProviderDriver` abstract classes and test mocks.
- **Requirements Addressed**: `ADR-0004`.
- **Prerequisites**: Phase 12.
- **Deliverables**: Driver interfaces, mock driver implementations, contract test suite.
- **Verification Methods**: 100% test coverage against mock driver implementations.
- **Acceptance Criteria**: Adding a new provider requires implementing the interface without modifying core order logic.
- **Downstream Phases Affected**: Phases 14–19.

### Phase 14: cPanel & WHM Production Provisioning Connector
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Deliver a concrete driver connecting Runstead to cPanel/WHM hypervisors via XML-API and UAPI.
- **Scope**: Automated cPanel account creation, package assignment, suspension, unsuspension, termination, SSO link generation.
- **Requirements Addressed**: `FR-PRV-001`, `FR-PRV-003`, `ADR-0004`.
- **Prerequisites**: Phase 12, Phase 13.
- **Deliverables**: `WHMDriver` class, credential encryption at rest, live integration test suite.
- **Verification Methods**: Integration test suite against live/mocked WHM API daemon.
- **Acceptance Criteria**: Service orders automatically create verified cPanel accounts and return valid SSO tokens.
- **Downstream Phases Affected**: Phase 15.

### Phase 15: Plesk & DirectAdmin Provider Connectors
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Expand provisioning support to Plesk REST API and DirectAdmin CMD_API.
- **Scope**: Account lifecycle operations on Plesk Onyx/Obsidian and DirectAdmin control panels.
- **Requirements Addressed**: `FR-PRV-003`.
- **Prerequisites**: Phase 13, Phase 14.
- **Deliverables**: `PleskDriver`, `DirectAdminDriver`, integration fixtures.
- **Verification Methods**: Automated contract test runs verifying feature parity with WHM driver.
- **Acceptance Criteria**: Both drivers conform 100% to `HostingProviderDriver` lifecycle contracts.
- **Downstream Phases Affected**: Phase 20.

### Phase 16: Upstream EPP Domain Registrar Connectors
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Connect domain search and purchase to concrete registrar APIs (ResellerClub, Enom, Namecheap).
- **Scope**: EPP availability checks, live domain registration, contact WHOIS binding, nameserver management.
- **Requirements Addressed**: `FR-DOM-001`, `ADR-0004`.
- **Prerequisites**: Phase 12, Phase 13.
- **Deliverables**: `ResellerClubDriver`, `EnomDriver`, registrar balance monitor.
- **Verification Methods**: Sandbox registrar integration test suite.
- **Acceptance Criteria**: Purchased domains register live in registrar sandbox and bind customer nameservers.
- **Downstream Phases Affected**: Phase 17.

### Phase 17: Authoritative Anycast DNS Synchronization Network
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Synchronize RFC-compliant DNS zones to global authoritative edge providers (Cloudflare / PowerDNS).
- **Scope**: Zone push API, record diffing, SOA serial auto-increment, DNSSEC flag propagation.
- **Requirements Addressed**: `FR-DNS-001`, `ADR-0004`.
- **Prerequisites**: Phase 12, Phase 13.
- **Deliverables**: `CloudflareDNSDriver`, `PowerDNSDriver`, zone synchronization worker.
- **Verification Methods**: Automated DNS query tests asserting public record propagation via `dig`/DoH.
- **Acceptance Criteria**: UI record edits propagate to authoritative nameservers within 5 seconds.
- **Downstream Phases Affected**: Phase 18.

### Phase 18: Automated ACME & Let's Encrypt Wildcard SSL Manager
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Automate SSL certificate issuance and renewal via DNS-01 and HTTP-01 ACME challenges.
- **Scope**: Let's Encrypt client, automated DNS challenge record injection, certificate renewal cron (60-day renewal).
- **Requirements Addressed**: `FR-PRV-002`, `FR-DNS-001`.
- **Prerequisites**: Phase 12, Phase 17.
- **Deliverables**: ACME manager service, certificate vault, auto-renewal daemon.
- **Verification Methods**: ACME staging environment automated issuance and validation tests.
- **Acceptance Criteria**: Wildcard certificates issue automatically without manual customer DNS intervention.
- **Downstream Phases Affected**: Phase 19.

### Phase 19: Outbound Webhooks Delivery Engine & Event Bus
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Dispatch HMAC-signed webhook notifications to reseller endpoints on business and service events.
- **Scope**: Event bus, reseller endpoint registration, HMAC-SHA256 signature headers, retry policy.
- **Requirements Addressed**: `NFR-REL-001`, `SEC-002`.
- **Prerequisites**: Phase 12.
- **Deliverables**: Webhook dispatcher service, delivery log UI, webhook retry processor.
- **Verification Methods**: Webhook receiver mock tests checking signature verification and payload fidelity.
- **Acceptance Criteria**: Resellers can subscribe to events (`order.paid`, `service.suspended`, `ticket.created`) with guaranteed at-least-once delivery.
- **Downstream Phases Affected**: Phase 20.

### Phase 20: Transactional Email, SMS & Multi-Channel Notification Router
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Implement production notification delivery for invoices, service credentials, password resets, and tickets.
- **Scope**: Postmark / SendGrid / Resend email connector, Twilio SMS connector, customizable HTML templates.
- **Requirements Addressed**: `FR-BIL-001`, `FR-SUP-001`.
- **Prerequisites**: Phase 12.
- **Deliverables**: Email template renderer, notification dispatch router, bounce/spam tracking.
- **Verification Methods**: Automated test suite asserting template variable substitution and mail server dispatch.
- **Acceptance Criteria**: System sends DKIM/SPF-aligned transactional emails for all primary business actions.
- **Downstream Phases Affected**: Phase 21.

### Phase 21: Horizon B Integration Hardening & End-to-End Verification
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Comprehensive integration verification of all Horizon B automation drivers and job queues.
- **Scope**: Failure testing, rate-limit recovery, chaos injection, performance under heavy queue load.
- **Requirements Addressed**: All Horizon B requirements (`FR-PRV-001..003`, `FR-DOM-001`, `FR-DNS-001`).
- **Prerequisites**: Phases 12–20.
- **Deliverables**: End-to-end integration test harness, load test reports, runbooks.
- **Verification Methods**: Automated regression and load test suites.
- **Acceptance Criteria**: Zero unhandled exceptions across 10,000 simulated provisioning and billing actions.
- **Downstream Phases Affected**: Phase 22 (Horizon C).

---

### *HORIZON C: OWNED INFRASTRUCTURE PLATFORM (PHASES 22 – 31)*

### Phase 22: Hypervisor Fleet Telemetry & Node Agent Architecture
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Design and implement the lightweight host agent running on bare-metal virtualization nodes.
- **Scope**: Node agent daemon (Go or Rust), gRPC telemetry transport, CPU/RAM/IO metrics collection.
- **Requirements Addressed**: `FR-TEN-003`, Horizon C vision.
- **Prerequisites**: Phase 21.
- **Deliverables**: Host agent daemon, gRPC server, fleet node status dashboard.
- **Verification Methods**: Agent communication and heartbeating test suite.
- **Acceptance Criteria**: Nodes stream real-time utilization telemetry to the fleet operator console with <2s latency.
- **Downstream Phases Affected**: Phases 23–31.

### Phase 23: Bare-Metal Virtual Machine Orchestration Core (KVM/QEMU)
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Direct orchestration of Linux KVM virtual machines bypassing third-party hosting panels.
- **Scope**: libvirt / cloud-init VM provisioning, vCPU/RAM allocation, disk image cloning, virtual network bridging.
- **Requirements Addressed**: Horizon C vision.
- **Prerequisites**: Phase 22.
- **Deliverables**: VM driver module, cloud-init template library, guest lifecycle manager.
- **Verification Methods**: Automated VM creation, network ping, and teardown tests.
- **Acceptance Criteria**: VMs boot, configure root SSH keys via cloud-init, and attach to private networks automatically.
- **Downstream Phases Affected**: Phases 24, 25.

### Phase 24: Containerized Shared Hosting Engine (cgroup v2 & Namespace Isolation)
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Develop native containerized shared hosting instances providing cgroup-bounded PHP/Node/MySQL environments.
- **Scope**: OCI container runtime integration, cgroup resource bounding, chroot/jail filesystem isolation.
- **Requirements Addressed**: Horizon C vision.
- **Prerequisites**: Phase 22.
- **Deliverables**: Shared hosting container daemon, resource throttle manager, web stack template.
- **Verification Methods**: Resource contention and noisy-neighbor stress tests.
- **Acceptance Criteria**: Bounded container cannot consume more than allocated CPU/RAM quotas under intentional infinite loops.
- **Downstream Phases Affected**: Phases 25, 26.

### Phase 25: Native Web-Based Hosting Control Panel
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Build the lightweight, responsive customer control panel for file management, databases, and mailboxes.
- **Scope**: Web-based file manager, MySQL/MariaDB database wizard, phpMyAdmin integration, FTP/SFTP account manager.
- **Requirements Addressed**: Horizon C vision.
- **Prerequisites**: Phases 23, 24.
- **Deliverables**: Embedded control panel UI, secure session delegation, file operation APIs.
- **Verification Methods**: Playwright browser journeys verifying file upload, extraction, and database creation.
- **Acceptance Criteria**: End customers can manage website files, databases, and SSL certificates without third-party licenses.
- **Downstream Phases Affected**: Phase 26.

### Phase 26: Authoritative Globally Distributed Anycast DNS Cluster
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Deploy owned authoritative Anycast BIND9/PowerDNS edge servers across global Points of Presence (PoPs).
- **Scope**: BGP Anycast routing, automated zone catalog transfers, DNSSEC signing, AXFR replication.
- **Requirements Addressed**: `FR-DNS-001`, Horizon C vision.
- **Prerequisites**: Phase 17, Phase 22.
- **Deliverables**: Anycast node deployment scripts, zone replication daemon, latency monitoring.
- **Verification Methods**: Global DNS lookup latency benchmarks across continents.
- **Acceptance Criteria**: Authoritative responses resolve globally with sub-20ms average latency and 100% DNSSEC validity.
- **Downstream Phases Affected**: Phase 27.

### Phase 27: Deduplicated Block & Object Backup Storage Engine
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Implement encrypted, deduplicated backup storage with point-in-time snapshot recovery for VMs and accounts.
- **Scope**: Chunk-based content-addressable storage (CAS), zstandard compression, client-side AES-256 encryption, S3 export.
- **Requirements Addressed**: `NFR-REL-001`, Horizon C vision.
- **Prerequisites**: Phases 23, 24.
- **Deliverables**: Backup snapshot agent, restoration manager, backup quota verification.
- **Verification Methods**: Snapshot backup and bite-for-bite restoration test suite.
- **Acceptance Criteria**: Test VMs and customer home directories restore cleanly to identical byte signatures.
- **Downstream Phases Affected**: Phase 28.

### Phase 28: Platform Multi-Region High Availability & Failover
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Establish multi-region database replication, automated DNS failover, and zero-downtime routing.
- **Scope**: PostgreSQL active-passive replica failover, multi-region Next.js edge deployment, automated health checks.
- **Requirements Addressed**: `NFR-REL-001`.
- **Prerequisites**: Phases 22–27.
- **Deliverables**: Failover runbooks, health probe daemon, automated DNS failover triggers.
- **Verification Methods**: Chaos failover drills simulating primary region network cut.
- **Acceptance Criteria**: Traffic shifts to standby region within 60 seconds with 0 data loss on committed transactions.
- **Downstream Phases Affected**: Phase 29.

### Phase 29: Developer REST & GraphQL Public API Platform
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Publish comprehensive, versioned public APIs with API key management and rate limiting for developers.
- **Scope**: OpenAPI 3.1 specification, developer documentation portal, scoped API keys, SDK generation (TypeScript, Python, Go).
- **Requirements Addressed**: Developer ecosystem enablement.
- **Prerequisites**: All previous functional phases.
- **Deliverables**: OpenAPI schema, interactive API documentation, client SDK packages.
- **Verification Methods**: Automated API test suite executing against all published OpenAPI endpoints.
- **Acceptance Criteria**: 100% of documented endpoints pass automated compliance testing against the OpenAPI schema.
- **Downstream Phases Affected**: Phase 30.

### Phase 30: Enterprise Compliance, Penetration Testing & Security Audit
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Conduct rigorous third-party penetration testing, static code analysis, and compliance verification.
- **Scope**: External white-box penetration test, OWASP Top 10 remediation, SOC2/ISO 27001 readiness review, threat model closure.
- **Requirements Addressed**: `SEC-001`, `SEC-002`, `NFR-SEC-001`.
- **Prerequisites**: Phases 1–29.
- **Deliverables**: Penetration test remediation report, updated threat model, compliance evidence binder.
- **Verification Methods**: Independent penetration test and zero unresolved CVE scan.
- **Acceptance Criteria**: 0 critical or high findings; clean security sign-off.
- **Downstream Phases Affected**: Phase 31.

### Phase 31: Production Launch, v1.0 Release & General Availability
- **Status**: `PROPOSED — NOT APPROVED`
- **Objective**: Execute the commercial General Availability (GA) launch of Runstead v1.0.
- **Scope**: Final migration dry-run, signed Git tag (`v1.0.0`), production release notes, customer onboarding migration tooling.
- **Requirements Addressed**: Full project scope across Horizons A, B, and C.
- **Prerequisites**: Phases 0 through 30 fully accepted.
- **Deliverables**: Signed release tag, production deployment verification, public launch announcement.
- **Verification Methods**: Production readiness smoke tests against live production infrastructure.
- **Acceptance Criteria**: 100% of exit criteria for all 32 phases satisfied and accepted.
- **Downstream Phases Affected**: Post-v1.0 ongoing maintenance operations.

---

## 4. Cross-Phase Dependency & Scope Protection Rules

1. **Strict Upstream Gating**: No phase may begin implementation until its explicit prerequisite phases have passed their Definition of Done exit gate.
2. **Zero Architecture Drift**: Introducing a new third-party dependency, database engine, or external integration requires an approved Architecture Decision Record (ADR).
3. **Change Control Procedure**: Any modification to phase scope, delivery sequence, or requirement IDs must update this contract, [`docs/TRACEABILITY_MATRIX.md`](file:///docs/TRACEABILITY_MATRIX.md), and [`docs/phase-0/RISK_REGISTER.md`](file:///docs/phase-0/RISK_REGISTER.md).
