# Runstead — Phase 2: PostgreSQL Row-Level Security (RLS) & Multi-Tenant Isolation Design

> **Project Name**: Runstead  
> **Phase**: 2 of 32 (Server-Side PostgreSQL Schema & Multi-Tenant RLS)  
> **Security Baseline**: `NFR-SEC-002`, `ADR-0003`  
> **Status**: **VERIFIED & ENFORCED**

---

## 1. Threat Model & Multi-Tenant Security Objective

In a commercial multi-tenant web hosting operating system, cross-tenant data leakage is a catastrophic failure mode. A vulnerability allowing Reseller A to view or manipulate Reseller B's customer data, credit balances, server credentials, or invoices invalidates platform trustworthiness.

The core objective of Phase 2 is to enforce multi-tenant isolation directly at the database engine level. Application-level filtering (`WHERE tenant_id = '...'`) provides basic utility, but is vulnerable to developer oversight. PostgreSQL Row-Level Security (RLS) provides a mathematical guarantee: **Tenant A cannot read, insert, update, or delete Tenant B's data under any CRUD operation, even if the application query completely omits a tenant filter.**

---

## 2. Tenant Context Mechanics: `app.current_tenant_id`

### 2.1 Transaction-Scoped Configuration
PostgreSQL allows setting session-level and transaction-level configuration parameters via `set_config`. To prevent connection pool leakage (e.g. across PgBouncer or persistent Node connection pools), Runstead mandates transaction-scoped context:

```sql
SELECT set_config('app.current_tenant_id', $1, true);
```

The third argument (`is_local = true`) guarantees that the setting applies exclusively to the current transaction block (`BEGIN ... COMMIT / ROLLBACK`). When the transaction finishes, PostgreSQL automatically resets `app.current_tenant_id`, preventing any leftover state on that physical connection.

### 2.2 Fail-Closed Helper Function: `current_tenant_id()`
To handle missing, empty, or malformed tenant identifiers without unhandled database crashes, Runstead defines an exception-safe STABLE PL/pgSQL function:

```sql
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Security Behavioral Guarantees**:
1. **Missing Context**: When `app.current_tenant_id` is unset, `current_setting(..., true)` returns `NULL`. `current_tenant_id()` returns `NULL`.
2. **Empty Context**: When `app.current_tenant_id = ''`, `NULLIF('', '')` evaluates to `NULL`.
3. **Malformed Identifier**: If an attacker attempts to supply non-UUID strings (`'malformed-tenant'` or `'1; DROP TABLE'`), the cast raises an exception which is caught and returned as `NULL`.
4. **Valid UUID**: Returns the parsed `UUID` for policy evaluation.

Since `tenant_id = NULL` always evaluates to `UNKNOWN` in SQL boolean logic, any query executed without a valid tenant context returns **0 rows** and rejects all inserts/updates.

---

## 3. RLS Policies and `FORCE ROW LEVEL SECURITY`

### 3.1 Policy Definition
For every tenant-owned table, an RLS policy is registered for all CRUD operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`):

```sql
CREATE POLICY "<table_name>_tenant_isolation_policy" ON "<table_name>"
  FOR ALL
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());
```

- **`USING` clause**: Controls row visibility for `SELECT`, `UPDATE`, and `DELETE`. Rows where `tenant_id != current_tenant_id()` are completely invisible.
- **`WITH CHECK` clause**: Controls write validity for `INSERT` and `UPDATE`. Any attempt to insert a record with a mismatched `tenant_id`, or update `tenant_id` to another value, raises:
  `ERROR: new row violates row-level security policy for table "<table_name>"`.

### 3.2 Forced RLS (`FORCE ROW LEVEL SECURITY`)
By default in PostgreSQL, the table owner (the role that created the tables, e.g. `runstead_admin`) bypasses RLS policies. Runstead eliminates this loophole by applying `FORCE ROW LEVEL SECURITY` to every tenant-owned table:

```sql
ALTER TABLE "<table_name>" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "<table_name>" FORCE ROW LEVEL SECURITY;
```

With `FORCE ROW LEVEL SECURITY`, even the table owner is subject to RLS policies. Only a superuser or a role explicitly granted `BYPASSRLS` can bypass them.

---

## 4. Protected Table Inventory (18 Tables)

Row-Level Security is actively enforced on all 18 tenant-owned and tenant-scoped tables:

1. `tenants` (USING `id = current_tenant_id()`, WITH CHECK `id = current_tenant_id()`)
2. `tenant_memberships`
3. `customers`
4. `products`
5. `product_pricing`
6. `orders`
7. `order_items`
8. `invoices`
9. `invoice_items`
10. `payments`
11. `services`
12. `domains`
13. `dns_records`
14. `tickets`
15. `ticket_messages`
16. `provider_credentials`
17. `background_jobs`
18. `audit_events`

Global user identity (`users`) does not have a `tenant_id` because a single user identity may legitimately belong to multiple reseller organizations through `tenant_memberships`.

---

## 5. Defense in Depth: Composite Foreign Keys

RLS is paired with composite foreign keys to prevent cross-tenant referencing attacks:

```sql
-- An Order cannot reference a Customer belonging to another tenant
ALTER TABLE "orders" 
  ADD CONSTRAINT "orders_tenant_id_customer_id_fkey" 
  FOREIGN KEY ("tenant_id", "customer_id") 
  REFERENCES "customers"("tenant_id", "id") 
  ON DELETE RESTRICT;
```

If an attacker attempts to construct a request associating Tenant A's order with Tenant B's customer, the composite foreign key constraint fails immediately (`P2003`), independently of RLS.

---

## 6. Server-Side Context Abstraction (`withTenantContext`)

Application code interacts with the database exclusively through the `withTenantContext` helper:

```typescript
import { withTenantContext, appPrisma } from '@/lib/db';

export async function getTenantCustomers(tenantId: string) {
  return withTenantContext(tenantId, async (tx) => {
    // tx is an interactive transaction client configured with app.current_tenant_id
    return tx.customer.findMany();
  }, appPrisma);
}
```

### Untrusted Client Input Boundary
- In Phase 2, `tenant_id` must come from trusted internal test harnesses or server-side configurations.
- Direct HTTP requests, query parameters, cookies, or JSON bodies must **never** be trusted as proof of tenant identity until Phase 3 (Authentication & RBAC) introduces cryptographic session verification.
