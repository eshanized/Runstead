# Runstead — Phase 2: Database Migration & Deployment Guide

> **Project Name**: Runstead  
> **Phase**: 2 of 32 (Server-Side PostgreSQL Schema & Multi-Tenant RLS)  
> **Tooling**: Prisma Migrate & PostgreSQL DDL  
> **Target Environments**: Local Development, CI Service Containers, Production PostgreSQL

---

## 1. Migration Philosophy & Standards

Runstead adheres to strict versioned database migration standards:
1. **Zero Runtime Schema Drift**: Schema changes are never applied directly through ad-hoc manual queries or runtime auto-synchronization (`prisma db push`). All changes must exist as committed migration files in `prisma/migrations/`.
2. **Reviewable, Committed SQL**: Each migration is stored as an immutable, sequential SQL script (`prisma/migrations/<timestamp>_<name>/migration.sql`) tracked in Git.
3. **Embedded Security Policies**: Custom PostgreSQL DDL statements (`ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, `CREATE POLICY`, and role grants) are versioned directly alongside table definitions within the migration files.
4. **Deterministic Deployment**: CI and production environments use `prisma migrate deploy`, which executes only unapplied migrations in strict chronological order and records completion in `_prisma_migrations`.

---

## 2. Migration Inventory

| Migration Identifier | Name | Summary of Changes |
| :--- | :--- | :--- |
| `20261015081632_init_phase2_schema` | `init_phase2_schema` | Initial production schema: 19 tables (`tenants`, `users`, `tenant_memberships`, `customers`, `products`, `product_pricing`, `orders`, `order_items`, `invoices`, `invoice_items`, `payments`, `services`, `domains`, `dns_records`, `tickets`, `ticket_messages`, `provider_credentials`, `background_jobs`, `audit_events`), composite foreign keys, `current_tenant_id()` helper function, RLS activation and `FORCE ROW LEVEL SECURITY` across 18 tables, and role grants for `runstead_app`. |

---

## 3. Operational Commands

### 3.1 Applying Migrations to an Existing or Fresh Database
To apply all pending migrations deterministically:

```bash
# Uses DATABASE_URL from environment or .env
npm run db:migrate

# Equivalent Prisma CLI invocation:
npx prisma migrate deploy
```

### 3.2 Developing New Schema Migrations
When introducing new models, relations, or fields in future phases:

```bash
# 1. Update prisma/schema.prisma with model changes
# 2. Generate a draft migration file without applying it
npx prisma migrate dev --create-only --name <descriptive_migration_name>

# 3. Inspect the generated prisma/migrations/<timestamp>_<name>/migration.sql
# 4. If new tenant-owned tables were created, append:
#    - ALTER TABLE "<table_name>" ENABLE ROW LEVEL SECURITY;
#    - ALTER TABLE "<table_name>" FORCE ROW LEVEL SECURITY;
#    - CREATE POLICY "<table_name>_tenant_isolation_policy" ON "<table_name>"
#        FOR ALL USING ("tenant_id" = current_tenant_id()) WITH CHECK ("tenant_id" = current_tenant_id());
#    - GRANT SELECT, INSERT, UPDATE, DELETE ON "<table_name>" TO runstead_app;

# 5. Apply the migration to your local development database
npx prisma migrate dev

# 6. Re-generate Prisma Client types
npm run db:generate
```

### 3.3 Validating Schema & Client Generation
```bash
# Validate schema syntax and configuration
npm run db:validate

# Generate strongly typed Prisma Client bindings
npm run db:generate
```

### 3.4 Seeding Development / Test Fixtures
```bash
# Seeds Tenant A and Tenant B fixtures under RLS context
npm run db:seed

# Equivalent direct Node invocation:
node --experimental-strip-types prisma/seed.ts
```

---

## 4. Database Roles & Privilege Setup

To ensure Row-Level Security cannot be bypassed by runtime application queries, Runstead defines two distinct database roles:

### 4.1 Administrative / Migration Role (`runstead_admin`)
- **Capabilities**: Schema owner, table creation, DDL execution, index management.
- **Used By**: `prisma migrate deploy`, CI setup, initial database provisioning.
- **Connection Variable**: `DATABASE_URL` / `DIRECT_URL`.

### 4.2 Application Query Role (`runstead_app`)
- **Capabilities**: `USAGE` on schema `public`, `SELECT, INSERT, UPDATE, DELETE` on domain tables, `USAGE, SELECT` on sequences.
- **Privilege Exclusions**: Strictly **`NOSUPERUSER`**, **`NOCREATEDB`**, **`NOCREATEROLE`**, and **`NOBYPASSRLS`**.
- **Used By**: Next.js runtime servers, API route handlers, background workers, and integration test suites.
- **Connection Variable**: `APP_DATABASE_URL` / `APP_DATABASE_TEST_URL`.

Provisioning SQL (run once per cluster):
```sql
CREATE ROLE runstead_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '<secure_password>';
GRANT USAGE ON SCHEMA public TO runstead_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO runstead_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO runstead_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO runstead_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO runstead_app;
```

---

## 5. Local Development Setup

To run a native local PostgreSQL instance without root or Docker (as verified on Linux x86_64):

1. **Initialize a local database cluster**:
   ```bash
   initdb -D /path/to/local/pg_data --auth=trust -U postgres
   ```
2. **Start the database server on port 54329**:
   ```bash
   pg_ctl -D /path/to/local/pg_data -o "-p 54329" -l pg.log start
   ```
3. **Provision the database and roles**:
   ```bash
   psql -h 127.0.0.1 -p 54329 -U postgres -c "
     CREATE ROLE runstead_admin WITH LOGIN SUPERUSER PASSWORD 'admin_secret';
     CREATE ROLE runstead_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD 'app_secret';
     CREATE DATABASE runstead_dev OWNER runstead_admin;
     CREATE DATABASE runstead_test OWNER runstead_admin;
   "
   ```
4. **Deploy migrations**:
   ```bash
   npm run db:migrate
   ```
5. **Seed development fixtures**:
   ```bash
   npm run db:seed
   ```
6. **Execute RLS Integration Tests**:
   ```bash
   npm run test:db
   ```
