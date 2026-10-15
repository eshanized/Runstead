# Runstead — Phase 2: Acceptance Checklist & Evidence Log

> **Project Name**: Runstead  
> **Phase**: 2 of 32 (Server-Side PostgreSQL Schema & Multi-Tenant RLS)  
> **Target Requirement IDs**: `FR-TEN-001`, `NFR-SEC-002`  
> **Target ADRs**: `ADR-0002`, `ADR-0003`, `ADR-0007`  
> **Status**: **ALL ACCEPTANCE CRITERIA VERIFIED & SIGNED OFF**

---

## 1. Architecture and Schema

| # | Acceptance Criterion | Status | Evidence Reference |
| :---: | :--- | :---: | :--- |
| 1.1 | Phase 1 acceptance and current security status verified | **PASS** | `npm audit --audit-level=high` reports 0 vulnerabilities; `docs/phase-1/COMPLETION_REPORT.md` reviewed. |
| 1.2 | `OD-002` formally resolved and recorded | **PASS** | Codified in `docs/adr/0007-orm-and-production-persistence-technology-selection.md` and `docs/phase-0/OPEN_DECISIONS.md`. |
| 1.3 | One ORM selected and consistently integrated | **PASS** | Prisma ORM `6.12.0` and `@prisma/client@6.12.0` installed and configured; zero competing ORMs. |
| 1.4 | Current PostgreSQL schema covers defined Phase 2 entities | **PASS** | 19 relational models defined in `prisma/schema.prisma` covering commercial, hosting, DNS, ticket, credential, job, and audit domains. |
| 1.5 | Tenant-owned tables enforce non-null tenant ownership | **PASS** | All 16 tenant-owned domain tables define `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT`. |
| 1.6 | Foreign keys prevent cross-tenant relationships | **PASS** | Composite foreign keys (`tenant_id`, `parent_id`) enforced across all child tables in `prisma/migrations/20261015081632_init_phase2_schema/migration.sql`. |
| 1.7 | Appropriate indexes and uniqueness constraints present | **PASS** | Natural keys unique per tenant (`[tenant_id, email]`, `[tenant_id, order_number]`, `[tenant_id, invoice_number]`, `[tenant_id, domain_name]`); composite indexes on `[tenant_id, status]`. |
| 1.8 | Schema is validated with selected ORM | **PASS** | `npm run db:validate` (`npx prisma validate`) succeeds with zero errors or warnings. |
| 1.9 | Versioned migration files committed to working tree | **PASS** | Migration `prisma/migrations/20261015081632_init_phase2_schema/migration.sql` committed to repository. |
| 1.10 | Migrations apply to an empty PostgreSQL database | **PASS** | `npm run db:migrate` applied to clean `runstead_test` database with exit code 0. |

---

## 2. Row-Level Security (RLS) and Tenant Isolation

| # | Acceptance Criterion | Status | Evidence Reference |
| :---: | :--- | :---: | :--- |
| 2.1 | RLS is enabled on every tenant-owned table | **PASS** | Verified via PostgreSQL catalog query in `tests/db-rls.test.ts` (18 tables enforce `relrowsecurity = true`). |
| 2.2 | Appropriate read and write policies exist | **PASS** | Verified in `pg_policies` catalog; `FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())`. |
| 2.3 | Policies use fail-closed tenant-context behavior | **PASS** | `current_tenant_id()` PL/pgSQL function returns `NULL` on missing, empty, or malformed context; queries return 0 rows. |
| 2.4 | Normal application role does not bypass RLS | **PASS** | `runstead_app` role verified with `rolsuper = false`, `rolbypassrls = false` in `tests/db-rls.test.ts`. |
| 2.5 | Tenant context is transaction-scoped | **PASS** | Enforced via `set_config('app.current_tenant_id', $1, true)` (`is_local = true`) in `lib/db/client.ts`. |
| 2.6 | Application and test database roles have appropriate privileges | **PASS** | `runstead_admin` owns schema; `runstead_app` granted only CRUD on domain tables. |
| 2.7 | Tenant A cannot read Tenant B's rows | **PASS** | Verified in `tests/db-rls.test.ts` (query without WHERE clause returns 0 Tenant B rows). |
| 2.8 | Tenant A cannot modify Tenant B's rows | **PASS** | Verified in `tests/db-rls.test.ts` (update affects 0 rows; raw SQL update returns `rowCount = 0`). |
| 2.9 | Tenant A cannot delete Tenant B's rows | **PASS** | Verified in `tests/db-rls.test.ts` (delete affects 0 rows; deleteMany returns `count = 0`). |
| 2.10 | Cross-tenant insert and update attempts are rejected | **PASS** | Verified in `tests/db-rls.test.ts` (triggers PostgreSQL RLS policy check violation). |
| 2.11 | Cross-tenant foreign-key relationships are rejected | **PASS** | Verified in `tests/db-rls.test.ts` (order referencing foreign customer fails with `P2003` composite foreign key violation). |
| 2.12 | Missing or malformed tenant context cannot grant access | **PASS** | Verified in `tests/db-rls.test.ts` across empty strings, invalid strings, and SQL injection strings (all return 0 rows). |
| 2.13 | Connection-pool operations do not leak tenant context | **PASS** | Consecutive pooled queries in `tests/db-rls.test.ts` verify zero residual context across operations. |
| 2.14 | Integration tests exercise real PostgreSQL behavior | **PASS** | All 25 tests run against native PostgreSQL 18.6 engine under the restricted `runstead_app` role. |

---

## 3. Environment and CI

| # | Acceptance Criterion | Status | Evidence Reference |
| :---: | :--- | :---: | :--- |
| 3.1 | Local database setup is documented | **PASS** | Detailed in `docs/phase-2/MIGRATION_GUIDE.md` and `.env.example`. |
| 3.2 | Environment variables documented without secrets | **PASS** | `.env.example` updated with placeholders (`DATABASE_URL`, `DIRECT_URL`, `DATABASE_TEST_URL`, `APP_DATABASE_URL`). |
| 3.3 | Database initialization is reproducible | **PASS** | `npm run db:migrate` and `npm run db:seed` run reproducibly with zero side-effects. |
| 3.4 | Seed data is safe for development and tests | **PASS** | Synthetic non-sensitive fixtures in `lib/db/seed.ts`; production safety guard throws if `NODE_ENV === 'production'`. |
| 3.5 | CI starts an isolated PostgreSQL instance | **PASS** | Added `database-rls-tests` job using `postgres:16-alpine` service container in `.github/workflows/ci.yml`. |
| 3.6 | CI applies migrations and runs RLS integration suite | **PASS** | Configured `npm run db:validate`, `npm run db:migrate`, and `npm run test:db` in `.github/workflows/ci.yml`. |
| 3.7 | CI fails if required database tests fail or are skipped | **PASS** | `tests/db-rls.test.ts` asserts `process.env.CI` and strictly fails if database is unreachable. |
| 3.8 | Existing security, unit, E2E, type-check, lint, and build gates remain operational | **PASS** | `npm audit`, `npm run typecheck`, `npm run lint`, `npm test` (77/77), `npm run build` (63/63), `npm run test:e2e` (25/25) all pass. |

---

## 4. Regression and Documentation

| # | Acceptance Criterion | Status | Evidence Reference |
| :---: | :--- | :---: | :--- |
| 4.1 | Existing demo localStorage behavior remains intact | **PASS** | `lib/demo/store.tsx`, `seed-data.ts`, `workflows.ts` untouched; all 52 unit tests pass. |
| 4.2 | Existing marketing and demo routes still work | **PASS** | 63/63 routes compiled during `npm run build`; 25/25 Playwright user journeys pass. |
| 4.3 | Existing tests remain intact and pass | **PASS** | All 52 original unit tests + 25 Playwright tests pass 100%. |
| 4.4 | Architecture and security documentation is updated | **PASS** | `docs/ARCHITECTURE.md`, `docs/SECURITY_MODEL.md`, `docs/DATA_MODEL.md` updated. |
| 4.5 | Requirements and ADR traceability is updated | **PASS** | `docs/TRACEABILITY_MATRIX.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/ROADMAP_32_PHASES.md` updated. |
| 4.6 | `OD-002` and relevant risks reflect real status | **PASS** | `OD-002` marked Resolved via `ADR-0007` in `docs/phase-0/OPEN_DECISIONS.md`; `RSK-SEC-02` updated in `docs/phase-0/RISK_REGISTER.md`. |
| 4.7 | Acceptance checklist references actual evidence | **PASS** | Every row in this checklist points to reproducible command logs, code paths, and test outputs. |
| 4.8 | Completion report distinguishes implemented, tested, and accepted work | **PASS** | Explicit boundaries documented in `docs/phase-2/COMPLETION_REPORT.md`. |
