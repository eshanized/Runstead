# Runstead — Phase 0: Open Architectural & Governance Decisions

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Document Baseline**: Phase 0 (October 2026)  
> **Status**: Active Open Decisions Requiring Stakeholder Resolution

---

## 1. Summary of Open Decisions

| Decision ID | Area | Title | Severity / Urgency | Target Resolution Point |
| :--- | :--- | :--- | :--- | :--- |
| **OD-001** | Governance | **Adoption of the Reconstructed 32-Phase Roadmap Baseline** | High (Blocking Phase 1 Kickoff) | Phase 0 Exit Review |
| **OD-002** | Persistence | **ORM & Persistence Technology Selection (Prisma vs. Drizzle)** | Medium | Prior to Phase 2 Kickoff |
| **OD-003** | Security | **Dependency Hardening Scope for Phase 1** | Resolved (Phase 1) | Resolved via ADR-0006 (Next.js 15 Maintenance LTS & Scoped Overrides) |
| **OD-004** | Architecture | **Background Worker Queue Engine (BullMQ/Redis vs. PostgreSQL pg-boss)** | Medium | Prior to Phase 12 Kickoff |

---

## 2. Detailed Decision Profiles

### OD-001: Adoption of the Reconstructed 32-Phase Roadmap Baseline
- **Context**: The repository historically established a 6-milestone, 42-deliverable roadmap ([`docs/ROADMAP.md`](file:///docs/ROADMAP.md)) tracked via the public `/progress` dashboard. The user instructions specify organizing the project into 32 sequential phases (Phase 0 through Phase 31). An exhaustive search of the repository and git history revealed that a canonical 32-phase document was not previously committed into this repository.
- **Current State**: Phase 0 has authored [`docs/ROADMAP_32_PHASES.md`](file:///docs/ROADMAP_32_PHASES.md) structuring Phases 1 through 31 across Horizons A, B, and C, with full dependency trees and acceptance criteria, flagged as `PROPOSED — NOT APPROVED`.
- **Options Available**:
  - **Option A (Recommended)**: Formally approve the proposed 32-phase breakdown in [`docs/ROADMAP_32_PHASES.md`](file:///docs/ROADMAP_32_PHASES.md) as the authoritative project baseline for Phase 1 through Phase 31.
  - **Option B**: Provide an external canonical specification document from Tonmoy Infrastructure archives to supersede the proposed roadmap.
  - **Option C**: Maintain the 6-milestone delivery structure as primary and map the 32 phases as internal sub-phases.
- **Recommended Action**: Stakeholders review and sign off on Option A during the Phase 0 Exit Review.

---

### OD-002: ORM & Persistence Technology Selection (Prisma vs. Drizzle)
- **Context**: Phase 2 requires migrating the in-memory/localStorage demo state into a server-side PostgreSQL database with Row-Level Security (RLS) policies.
- **Options Available**:
  - **Option A (Prisma ORM)**: Mature ecosystem, excellent declarative schema DSL, built-in migration tooling (`prisma migrate`), strong client type-safety. Higher engine binary size on serverless.
  - **Option B (Drizzle ORM)**: Extremely lightweight, zero binary engine overhead, SQL-native query syntax, optimal cold start performance on Vercel Edge. Slightly more manual migration workflow.
- **Recommended Action**: Adopt **Prisma ORM** with PgBouncer connection pooling for schema clarity, automated migrations, and rapid developer onboarding.

---

### OD-003: Dependency Hardening Scope for Phase 1 (Resolved)
- **Context**: `npm audit` identified 26 dependency advisories (4 moderate, 21 high, 1 critical), primarily in Next.js 14.2.35, PostCSS, and transitive utilities. Running `npm audit fix --force` would trigger breaking major version upgrades (Next.js 16 or Tailwind 4). Next.js 14 was officially deprecated and unsupported by Vercel.
- **Resolution**: **Adopted Next.js 15.5.28 (Maintenance LTS)** with React 18.2.0 retention and scoped transitive overrides. Formally codified in [`docs/adr/0006-framework-upgrade-and-dependency-security-baseline.md`](file:///docs/adr/0006-framework-upgrade-and-dependency-security-baseline.md) and [`docs/phase-1/DEPENDENCY_AUDIT.md`](file:///docs/phase-1/DEPENDENCY_AUDIT.md). Resolved 100% of critical and high advisories (`npm audit` reports 0 vulnerabilities) while preserving all 65 routes and 28 Radix UI primitives.
- **Status**: **Resolved in Phase 1**.

---

### OD-004: Background Worker Queue Engine (BullMQ/Redis vs. PostgreSQL pg-boss)
- **Context**: Phase 12 introduces asynchronous job queues for provisioning, retries, and domain registrations.
- **Options Available**:
  - **Option A (BullMQ on Redis)**: High throughput, sub-millisecond job scheduling, battle-tested in enterprise Node.js environments. Requires running and maintaining a Redis cluster.
  - **Option B (pg-boss on PostgreSQL)**: Runs entirely within PostgreSQL using `SKIP LOCKED`. Guarantees transactional enqueuing (jobs and data committed atomically in a single SQL transaction). Eliminates Redis infrastructure overhead for moderate job volumes.
- **Recommended Action**: Adopt **pg-boss on PostgreSQL** for initial production phases to achieve atomic database transactions with zero external Redis infrastructure cost, retaining BullMQ as an upgrade path for high volume.
