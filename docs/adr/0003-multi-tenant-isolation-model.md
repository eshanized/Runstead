# ADR-0003: Multi-Tenant Data Isolation and Row-Level Security Model

> **Status**: Accepted  
> **Date**: October 2026  
> **Deciders**: Tonmoy Infrastructure Engineering Core  
> **Technical Scope**: Tenancy, Data Partitioning, Database Engine Security

---

## Context

Runstead hosts multiple reseller businesses on a single infrastructure platform. A catastrophic risk in hosting management software is cross-tenant data leakage—e.g., Reseller A seeing Reseller B's customer records, server credentials, invoices, or support tickets.

We must decide on the multi-tenancy partitioning model: database-per-tenant, schema-per-tenant, or shared-schema with Row-Level Security (RLS).

---

## Decision

We decide to adopt a **Shared Database, Shared Schema with PostgreSQL Row-Level Security (RLS)** model:

1. **Mandatory Tenant Foreign Key**: Every relational domain table must include a non-nullable `tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT`.
2. **Database Engine-Enforced RLS**: PostgreSQL RLS policies will be enabled on all tenant-owned tables. No query can bypass tenant boundaries even if application code inadvertently omits a filter.
3. **Session Tenant Context**: Application requests authenticate the tenant ID in edge middleware and set a PostgreSQL local transaction variable (`SET LOCAL app.current_tenant_id = '...'`).
4. **Platform Operator Fleet Bypass**: Platform fleet administration (Tonmoy Infrastructure) operates via an audited, explicit superuser connection role strictly isolated to administrative reporting routes.

---

## Alternatives Considered

- **Database-Per-Tenant**:
  - *Pros*: Complete physical database isolation.
  - *Cons*: Expensive connection pooling; migration operations across thousands of databases become unmanageable; high idle infrastructure cost.
- **Schema-Per-Tenant**:
  - *Pros*: Logical separation within a single database instance.
  - *Cons*: Schema migrations require running DDL across every tenant schema; limited table limits in PostgreSQL.

---

## Consequences

- **Positive**:
  - Cost-efficient scaling for thousands of small reseller tenants.
  - Centralized schema migrations and automated backups.
  - Security enforced at the database engine level, immune to accidental application query bugs.
- **Negative / Risks**:
  - Requires diligent index optimization on `(tenant_id, ...)` composite keys to prevent cross-tenant noisy-neighbor query degradation.
