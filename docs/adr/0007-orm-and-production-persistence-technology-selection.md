# ADR-0007: ORM Selection and Production Persistence Architecture

> **Status**: Accepted  
> **Date**: October 2026  
> **Deciders**: Tonmoy Infrastructure Engineering Core  
> **Technical Scope**: Database Persistence, ORM, Versioned Migrations, Connection Pooling, Multi-Tenant Row-Level Security (RLS)  
> **Supercedes/Updates**: Resolves [`docs/phase-0/OPEN_DECISIONS.md#od-002`](file:///docs/phase-0/OPEN_DECISIONS.md); implements [`docs/adr/0002-state-management-and-persistence-strategy.md`](file:///docs/adr/0002-state-management-and-persistence-strategy.md) and [`docs/adr/0003-multi-tenant-isolation-model.md`](file:///docs/adr/0003-multi-tenant-isolation-model.md)

---

## Context

Phase 2 establishes the production-grade relational database foundation for Runstead. Up to Phase 1, Runstead utilized an in-memory and client-side demonstration store (`lib/demo/store.tsx` backed by `localStorage`) to facilitate offline investor and stakeholder demonstrations. 

According to `ADR-0002` and `ADR-0003`, Runstead's production persistence architecture requires:
1. An authoritative relational PostgreSQL schema modeling tenants, users, customer CRM, catalog products, orders, invoices, payments, provisioned services, domains, DNS records, support tickets, and audit trails.
2. Database engine-enforced multi-tenant isolation using PostgreSQL Row-Level Security (RLS) on all tenant-owned tables, conditioned on a transaction-scoped `app.current_tenant_id` setting.
3. Declarative, version-controlled, and reproducible SQL schema migrations.
4. Strict TypeScript typing with deep relational integrity enforcement (including composite unique constraints and composite foreign keys preventing cross-tenant references).
5. Seamless coexistence with the existing offline demo (`lib/demo/*`), avoiding regressions to client routes and Playwright end-to-end tests.
6. Support for connection pooling (PgBouncer / AWS RDS Proxy / Supabase Transaction pooler) without leaking tenant context across pooled physical connections.

In `docs/phase-0/OPEN_DECISIONS.md`, decision `OD-002` identified Prisma ORM and Drizzle ORM as candidates, with a preliminary recommendation for Prisma based on schema clarity, declarative migrations, and developer onboarding. We must rigorously evaluate the candidate technologies against project requirements and officially record the selection.

---

## Evaluation of Candidates

### 1. Prisma ORM (Evaluated: Version 6.12.0)
- **TypeScript Integration**: Generates end-to-end strongly typed client bindings directly from `schema.prisma`. Full autocompletion and compile-time type validation across nested relations, selections, and filters.
- **Peer Dependency & Security Compatibility**: Prisma 6.12.x officially supports TypeScript `>=5.1.0` (aligning with `typescript: 5.2.2`) and has zero dependency security vulnerabilities (`npm audit` reports 0 vulnerabilities, avoiding the `deepmerge-ts` advisory present in 6.13+).
- **PostgreSQL & Migration Tooling**: The declarative `schema.prisma` DSL supports native PostgreSQL types (`UUID`, `Decimal`, `Timestamptz`, `Jsonb`), composite primary keys, composite unique constraints, and referential actions (`ON DELETE RESTRICT`). `prisma migrate` produces reviewable, deterministic SQL migration scripts in `prisma/migrations/`, seamlessly accommodating custom SQL for `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`, `FORCE ROW LEVEL SECURITY;`, and policy definitions.
- **RLS & Tenant Context**: Prisma supports interactive transactions (`prisma.$transaction(async (tx) => { ... })`) and client extensions (`prisma.$extends`). Within an interactive transaction, executing `SELECT set_config('app.current_tenant_id', $1, true)` guarantees that the tenant context is strictly local to that single database transaction, automatically cleared upon commit or rollback.
- **Connection Management & Pooling**: Direct support for transaction-mode PgBouncer connection pooling via separate connection strings (`DATABASE_URL` with `?pgbouncer=true` and `DIRECT_URL` for migration DDL operations).
- **Next.js 15 Compatibility**: Fully validated with Next.js 15.5.28 App Router, Server Actions, and Route Handlers using standard singleton client caching patterns.

### 2. Drizzle ORM (Evaluated: Version 0.38+)
- **TypeScript Integration**: Schema defined entirely in TypeScript (`pgTable`). Strong inference and query building with zero compilation step.
- **Performance**: Zero query engine binary overhead; minimal cold start impact on serverless/edge environments.
- **Migration & Schema Maintenance**: Uses `drizzle-kit generate` and `drizzle-kit migrate`. While lightweight, managing complex composite foreign keys across 15+ relational entities with custom RLS SQL requires more fragmented TypeScript configuration and manual migration editing compared to Prisma's unified schema DSL.
- **Ecosystem & Onboarding**: Prisma's declarative schema is widely recognized as the industry standard for clarity and maintainability across large cross-functional teams.

---

## Decision

We formally decide to:

1. **Select Prisma ORM (`prisma@6.12.0` and `@prisma/client@6.12.0`) as Runstead's Production Persistence Engine**:
   - Maintain the authoritative data model in `prisma/schema.prisma`.
   - Generate strongly typed client models via `prisma generate`.
   - Track all database schema changes through versioned SQL migrations in `prisma/migrations/`.

2. **Adopt Transaction-Scoped PostgreSQL Row-Level Security (RLS)**:
   - Every tenant-owned table shall include `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT`.
   - Every tenant-owned table shall have RLS enabled and forced:
     ```sql
     ALTER TABLE "<table_name>" ENABLE ROW LEVEL SECURITY;
     ALTER TABLE "<table_name>" FORCE ROW LEVEL SECURITY;
     ```
   - RLS policies shall enforce:
     ```sql
     CREATE POLICY tenant_isolation_policy ON "<table_name>"
       FOR ALL
       USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
       WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
     ```
   - Setting `is_local = true` in `set_config('app.current_tenant_id', $1, true)` ensures the setting expires automatically upon transaction termination, eliminating connection-pool leakage risks.

3. **Establish a Safe Tenant Context Helper (`withTenantContext`)**:
   - Application queries interacting with tenant-owned tables must execute through a scoped transaction helper:
     ```typescript
     await db.withTenantContext(tenantId, async (tx) => {
       return tx.customer.findMany({ ... });
     });
     ```
   - Application queries without a valid tenant context fail closed (returning 0 rows on read, rejecting writes).

4. **Enforce Role Privilege Separation**:
   - Migrations and administrative DDL run under an administrative role (`runstead_admin` or database owner).
   - Application operations run under an unprivileged role (`runstead_app`) which does **NOT** have `SUPERUSER` or `BYPASSRLS` privileges.

5. **Strictly Preserve the Offline Demo**:
   - Retain `lib/demo/store.tsx`, `lib/demo/seed-data.ts`, and `lib/demo/workflows.ts` for browser-based offline demonstrations and client testing.
   - Do not connect browser code directly to PostgreSQL.
   - Keep Prisma and database connections strictly on the server side (`lib/db/*`).

---

## Official Documentation References

- Prisma Documentation: Schema Reference: `https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference`
- Prisma Documentation: PostgreSQL Row-Level Security: `https://www.prisma.io/docs/guides/database/postgresql/row-level-security`
- Prisma Documentation: Interactive Transactions: `https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions`
- PostgreSQL Official Documentation: Row Security Policies: `https://www.postgresql.org/docs/current/ddl-rowsecurity.html`
- PostgreSQL Official Documentation: `set_config` and Configuration Settings: `https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SET`

---

## Consequences

### Positive
- Clear, centralized declarative schema in `prisma/schema.prisma`.
- Fully versioned, reproducible SQL migrations tracked in Git under `prisma/migrations/`.
- Deep relational integrity and composite foreign keys preventing cross-tenant customer, order, invoice, and DNS record leakage.
- Database engine-enforced isolation via PostgreSQL RLS guaranteeing zero data leakage even if application filters are accidentally omitted.
- Full TypeScript type-safety across all domain models.
- Existing demo routes, unit tests, and Playwright tests continue to run offline with zero regressions.

### Trade-offs / Mitigations
- Prisma query engine requires generating platform-specific binaries (`libquery_engine`). Mitigated by including appropriate `binaryTargets = ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]` in `schema.prisma`.
- RLS policies require custom SQL statements in migration files that the Prisma schema DSL does not natively generate. Mitigated by disciplined migration authoring where RLS policies and `FORCE ROW LEVEL SECURITY` statements are systematically included in migration files.
