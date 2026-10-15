# Runstead — Phase 2: ORM & Persistence Technology Selection

> **Project Name**: Runstead  
> **Phase**: 2 of 32 (Server-Side PostgreSQL Schema & Multi-Tenant RLS)  
> **Decision Identifier**: `OD-002` / `ADR-0007`  
> **Status**: **RESOLVED / ACCEPTED**  
> **Selected Technology**: **Prisma ORM (`6.12.0`)** & **`@prisma/client` (`6.12.0`)**

---

## 1. Executive Summary & Context

Phase 2 requires transitioning Runstead's domain data model from client-side demo state (`lib/demo/store.tsx`) to an authoritative relational PostgreSQL database with engine-enforced multi-tenant Row-Level Security (RLS) under `app.current_tenant_id`.

In `docs/phase-0/OPEN_DECISIONS.md`, decision `OD-002` set forth two primary candidates:
1. **Prisma ORM**
2. **Drizzle ORM**

Following a rigorous evaluation across compatibility, security, migration reliability, RLS support, connection pooling, and developer experience, **Prisma ORM 6.12.0** has been selected and formally adopted.

---

## 2. Comprehensive Technology Evaluation Matrix

| Evaluation Dimension | Weight | Prisma ORM (v6.12.0) | Drizzle ORM (v0.38+) | Rationale & Project Context |
| :--- | :---: | :--- | :--- | :--- |
| **Declarative Schema DSL** | High | **Superior**: Unified, human-readable `schema.prisma` with explicit relations, indexes, composite keys, and enums. | **Good**: Schema defined in TypeScript files (`pgTable`). More verbose for complex cross-entity relationships. | Prisma provides a single source of truth for the entire domain model without boilerplate. |
| **PostgreSQL Features** | High | **Complete**: Native support for UUIDs, Timestamptz, Decimals, JSONB, Composite Unique/Foreign keys, and custom SQL migrations. | **Complete**: Native support for PostgreSQL types and raw SQL operators. | Both fully support PostgreSQL; Prisma's schema DSL expresses composite keys and constraints more succinctly. |
| **Migration Reliability** | Critical | **Deterministic**: `prisma migrate dev` and `prisma migrate deploy` maintain an immutable, sequential SQL migration history in `prisma/migrations/`. | **Good**: `drizzle-kit` generates SQL snapshots. Migration tracking and CI rollouts require additional configuration. | Runstead requires reproducible, audited migrations in version control that execute reliably across CI and production. |
| **Custom RLS SQL Policies** | Critical | **Supported**: Custom SQL files (`migration.sql`) can define `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, and `CREATE POLICY`. | **Supported**: Custom SQL can be appended to migration scripts. | Both accommodate custom RLS policies; Prisma's migration folders make custom SQL inspection straightforward. |
| **Transaction-Scoped Tenant Context** | Critical | **Supported**: Interactive transactions (`prisma.$transaction`) combined with `tx.$executeRaw` allow setting `set_config('app.current_tenant_id', $1, true)`. | **Supported**: `db.transaction()` allows executing raw SQL statements. | Both support setting transaction-scoped config variables with `is_local = true`. |
| **TypeScript Integration** | High | **Zero-Drift**: Automated type generation from schema guarantees 100% synchronization between database and TypeScript types. | **Zero-Drift**: Inferred directly from TypeScript definitions. | Both provide excellent type safety. |
| **Peer Dependencies & Runtime** | Critical | **100% Compatible**: `prisma@6.19.3` supports `typescript: '>=5.1.0'`, which perfectly matches the repo's `typescript: 5.2.2`. | **Compatible**: Compatible with TypeScript 5+. | Prisma 6.19.3 requires zero modifications to existing project toolchains or dependencies. |
| **Connection Pooling (PgBouncer)** | High | **Built-in**: Native support via `?pgbouncer=true` parameter and separate `DIRECT_URL` for migrations. | **Supported**: Connects via `pg` or `postgres` poolers. | Prisma's transaction-mode pooling is battle-tested. |
| **Next.js 15 Compatibility** | High | **Validated**: Full support for Next.js 15 App Router, Server Actions, Route Handlers, and React Server Components. | **Validated**: Full support for Next.js 15. | Both integrate seamlessly into Next.js. |
| **Developer Onboarding** | Medium | **Industry Standard**: Ubiquitous documentation, extensive tutorials, visual Prisma Studio, and active community. | **Growing**: Highly appreciated by advanced TypeScript developers, smaller community. | Prisma lowers the barrier to contribution across all 32 phases. |

---

## 3. Key Architectural Decisions & Safeguards

### 3.1 Migration Strategy
- Migrations are versioned SQL scripts located in `prisma/migrations/<timestamp>_<name>/migration.sql`.
- In development, schema modifications are drafted and migrated via `npx prisma migrate dev`.
- In CI and automated test pipelines, migrations are executed deterministically via `npx prisma migrate deploy`.
- All custom RLS policies (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, `CREATE POLICY ...`) are embedded directly into the committed migration SQL, guaranteeing that RLS is activated as soon as tables are created.

### 3.2 Tenant Isolation Pattern (`withTenantContext`)
To prevent cross-tenant data leakage and connection pool contamination:
1. Every tenant-owned database query executes within an interactive transaction.
2. The transaction executes:
   ```sql
   SELECT set_config('app.current_tenant_id', $1, true);
   ```
   The third parameter (`is_local = true`) guarantees that the configuration setting is discarded when the transaction commits or aborts.
3. If a connection is returned to a connection pool, no residual tenant state lingers on the session.
4. Database queries without a valid tenant context fail closed: `NULLIF(current_setting('app.current_tenant_id', true), '')` evaluates to `NULL`, resulting in zero matched rows and rejected writes.

### 3.3 Role Privilege Separation
- **Administrative / Migration Role (`runstead_admin`)**: Owns tables, applies DDL schema migrations, and configures database security settings.
- **Application Query Role (`runstead_app`)**: Unprivileged role used by Next.js application servers and integration tests. Granted `SELECT, INSERT, UPDATE, DELETE` on domain tables. Explicitly denied `SUPERUSER` and `BYPASSRLS`.

---

## 4. Preservation of the Offline Demo

Adopting Prisma for server-side persistence does not alter or disrupt the existing client demonstration provider:
- `lib/demo/store.tsx`, `lib/demo/seed-data.ts`, and `lib/demo/workflows.ts` remain completely intact.
- Browser components do not import or access Prisma directly.
- The 25 Playwright end-to-end tests continue running offline without requiring database credentials.
- Future phases (Phases 3–31) will progressively implement server-side repositories backed by Prisma while preserving demo mode as a development fixture.
