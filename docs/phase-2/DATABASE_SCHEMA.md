# Runstead — Phase 2: PostgreSQL Relational Database Schema Specification

> **Project Name**: Runstead  
> **Phase**: 2 of 32 (Server-Side PostgreSQL Schema & Multi-Tenant RLS)  
> **ORM Engine**: Prisma ORM `6.12.0`  
> **Database Engine**: PostgreSQL 16+ (Verified on PostgreSQL 18.6)  
> **Isolation Model**: Shared Database, Shared Schema with Database Engine Row-Level Security (`ADR-0003`)

---

## 1. Schema Architecture & Principles

Runstead's database schema enforces strict relational boundaries centered on the **Tenant (Reseller Business Account)**. The relational architecture implements five foundational design principles:

1. **Non-Null Tenant Foreign Key (`tenant_id`)**: Every tenant-owned table incorporates a mandatory, non-nullable `tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT`.
2. **Composite Uniqueness & Referential Integrity**: All tenant-owned records define a composite unique constraint `@@unique([tenantId, id])`. Related child tables enforce composite foreign keys `FOREIGN KEY ("tenant_id", "<foreign_id>") REFERENCES "<parent_table>"("tenant_id", "id")`. This prevents cross-tenant reference attacks at the relational algebra level.
3. **Engine-Level Row-Level Security**: Every tenant-owned table is configured with `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. Table owners and unprivileged application roles cannot bypass visibility policies.
4. **Appropriate Precision Types**: Financial values use fixed-point `DECIMAL(12, 2)` or `DECIMAL(10, 2)`. Identifiers use native PostgreSQL `UUID`s. Timestamps use timezone-aware `TIMESTAMPTZ(6)`. Flexible configurations (branding, limits, audit payloads) use native `JSONB`.
5. **Fail-Closed Tenancy**: When no transaction-local tenant context is set, all tenant-owned tables return 0 rows on read operations and reject write operations.

---

## 2. Relational Entity Inventory

The Phase 2 schema defines **19 relational tables** partitioned into four domain categories:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. TENANT & GLOBAL IDENTITY FOUNDATIONS                                │
│    - tenants (Root Reseller Account)                                   │
│    - users (Platform-Level Global Identity)                            │
│    - tenant_memberships (User <-> Tenant Join Table with Roles)        │
├────────────────────────────────────────────────────────────────────────┤
│ 2. COMMERCIAL DOMAIN (TENANT-OWNED)                                    │
│    - customers (Client Profiles)                                       │
│    - products (Catalog Product Offerings)                              │
│    - product_pricing (Billing Cycle Pricing Rules)                     │
│    - orders (Commercial Purchase Intent)                               │
│    - order_items (Order Line Items)                                    │
│    - invoices (Authoritative Financial Billing Records)                │
│    - invoice_items (Invoice Line Items)                                │
│    - payments (Financial Settlement Ledger)                            │
├────────────────────────────────────────────────────────────────────────┤
│ 3. HOSTING & DOMAIN DOMAIN (TENANT-OWNED)                              │
│    - services (Provisioned Web Hosting / VPS Instances)                │
│    - domains (Domain Portfolio & Registrations)                        │
│    - dns_records (RFC Authoritative DNS Zone Records)                  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. SUPPORT & OPERATIONAL INFRASTRUCTURE (TENANT-OWNED)                 │
│    - tickets (Customer Support Tickets)                                │
│    - ticket_messages (Support Thread Messages)                         │
│    - provider_credentials (cPanel, Plesk, Stripe, EPP Connectors)      │
│    - background_jobs (Asynchronous Execution Ledger)                   │
│    - audit_events (Immutable Append-Only Audit Trail)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Entity Details & Constraints

### 3.1 `tenants`
- **Purpose**: Root reseller hosting company.
- **Columns**: `id UUID PK`, `name VARCHAR(255)`, `slug VARCHAR(100) UNIQUE`, `plan_tier VARCHAR(50)`, `currency VARCHAR(3)`, `tax_rate DECIMAL(5,2)`, `brand_config JSONB`, `business_settings JSONB`, `created_at TIMESTAMPTZ(6)`, `updated_at TIMESTAMPTZ(6)`.
- **Security**: RLS enabled. Condition: `id = current_tenant_id()`.

### 3.2 `users`
- **Purpose**: Global user identity across the Runstead platform. Can hold memberships in multiple tenants.
- **Columns**: `id UUID PK`, `email VARCHAR(255) UNIQUE`, `name VARCHAR(255)`, `password_hash VARCHAR(255)`, `is_platform_admin BOOLEAN`, `created_at TIMESTAMPTZ(6)`, `updated_at TIMESTAMPTZ(6)`.
- **Scope**: Platform-level cross-tenant table.

### 3.3 `tenant_memberships`
- **Purpose**: Associates a global user with a tenant under a specific RBAC role (`owner`, `admin`, `support`, `billing`, `member`).
- **Columns**: `id UUID PK`, `tenant_id UUID FK`, `user_id UUID FK`, `role VARCHAR(50)`, `created_at TIMESTAMPTZ(6)`, `updated_at TIMESTAMPTZ(6)`.
- **Constraints**: `UNIQUE(tenant_id, user_id)`. RLS enabled.

### 3.4 `customers`
- **Purpose**: Client profile belonging to a reseller tenant.
- **Columns**: `id UUID PK`, `tenant_id UUID FK`, `name VARCHAR(255)`, `email VARCHAR(255)`, `company VARCHAR(255)`, `status VARCHAR(50)`, `country VARCHAR(2)`, `phone VARCHAR(50)`, `credit_balance DECIMAL(12,2)`, `total_revenue DECIMAL(12,2)`, `archived BOOLEAN`, `created_at TIMESTAMPTZ(6)`, `updated_at TIMESTAMPTZ(6)`.
- **Constraints**: `UNIQUE(tenant_id, id)`, `UNIQUE(tenant_id, email)`. Composite foreign key reference for child tables.

### 3.5 `products` & `product_pricing`
- **`products`**: `id UUID PK`, `tenant_id UUID FK`, `name VARCHAR(255)`, `type VARCHAR(50)`, `description TEXT`, `setup_fee DECIMAL(10,2)`, `available BOOLEAN`, `resource_limits JSONB`, `addons JSONB`, `created_at TIMESTAMPTZ(6)`, `updated_at TIMESTAMPTZ(6)`. `UNIQUE(tenant_id, id)`.
- **`product_pricing`**: `id UUID PK`, `tenant_id UUID FK`, `product_id UUID FK`, `cycle VARCHAR(50)`, `price DECIMAL(10,2)`. `UNIQUE(tenant_id, id)`, `UNIQUE(tenant_id, product_id, cycle)`.
- **FK Constraint**: `FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id) ON DELETE CASCADE`.

### 3.6 `orders` & `order_items`
- **`orders`**: `id UUID PK`, `tenant_id UUID FK`, `order_number VARCHAR(50)`, `customer_id UUID FK`, `product_id UUID FK`, `status VARCHAR(50)`, `amount DECIMAL(12,2)`, `billing_cycle VARCHAR(50)`. `UNIQUE(tenant_id, id)`, `UNIQUE(tenant_id, order_number)`.
- **FK Constraints**:
  - `FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT`.
  - `FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id) ON DELETE RESTRICT`.
- **`order_items`**: `id UUID PK`, `tenant_id UUID FK`, `order_id UUID FK`, `product_id UUID FK`, `description VARCHAR(255)`, `quantity INT`, `unit_price DECIMAL(12,2)`, `total_amount DECIMAL(12,2)`.
  - `FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id) ON DELETE CASCADE`.
  - `FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id) ON DELETE RESTRICT`.

### 3.7 `invoices`, `invoice_items`, and `payments`
- **`invoices`**: `id UUID PK`, `tenant_id UUID FK`, `invoice_number VARCHAR(50)`, `customer_id UUID FK`, `order_id UUID FK`, `status VARCHAR(50)`, `issue_date TIMESTAMPTZ(6)`, `due_date TIMESTAMPTZ(6)`, `paid_date TIMESTAMPTZ(6)`, `currency VARCHAR(3)`, `subtotal DECIMAL(12,2)`, `tax_rate DECIMAL(5,2)`, `tax_amount DECIMAL(12,2)`, `total_amount DECIMAL(12,2)`.
  - `FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT`.
  - `FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id) ON DELETE RESTRICT`.
- **`invoice_items`**: `id UUID PK`, `tenant_id UUID FK`, `invoice_id UUID FK`, `description VARCHAR(255)`, `quantity INT`, `unit_price DECIMAL(12,2)`, `total_amount DECIMAL(12,2)`.
  - `FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices(tenant_id, id) ON DELETE CASCADE`.
- **`payments`**: `id UUID PK`, `tenant_id UUID FK`, `invoice_id UUID FK`, `customer_id UUID FK`, `amount DECIMAL(12,2)`, `currency VARCHAR(3)`, `method VARCHAR(50)`, `provider_transaction_id VARCHAR(255)`, `status VARCHAR(50)`, `settled_at TIMESTAMPTZ(6)`.
  - `FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices(tenant_id, id) ON DELETE RESTRICT`.
  - `FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT`.

### 3.8 `services`, `domains`, and `dns_records`
- **`services`**: Provisioned web hosting or VPS instances. Linked to customer, product, and order via composite foreign keys.
- **`domains`**: Managed domain registrations. Linked to customer via composite foreign key. `UNIQUE(tenant_id, domain_name)`.
- **`dns_records`**: RFC-compliant authoritative zone records. Linked to domain via `FOREIGN KEY (tenant_id, domain_id) REFERENCES domains(tenant_id, id) ON DELETE CASCADE`.

### 3.9 `tickets`, `ticket_messages`
- **`tickets`**: Support tickets linked to customer via composite foreign key. `UNIQUE(tenant_id, ticket_number)`.
- **`ticket_messages`**: Thread messages linked to ticket via `FOREIGN KEY (tenant_id, ticket_id) REFERENCES tickets(tenant_id, id) ON DELETE CASCADE`. Supports `is_internal BOOLEAN` for staff-only notes.

### 3.10 `provider_credentials`, `background_jobs`, `audit_events`
- **`provider_credentials`**: Encrypted API secrets and connector settings (cPanel, Plesk, Stripe). `UNIQUE(tenant_id, provider_name)`.
- **`background_jobs`**: Job execution ledger with retry attempts and error tracking.
- **`audit_events`**: Immutable append-only ledger recording actor, action delta, IP address, and timestamp.

---

## 4. Referential Integrity Guarantees

The composite foreign key strategy enforces tenant isolation across nested entities:

```sql
-- Example: An invoice line item cannot be attached to another tenant's invoice
ALTER TABLE "invoice_items" 
  ADD CONSTRAINT "invoice_items_tenant_id_invoice_id_fkey" 
  FOREIGN KEY ("tenant_id", "invoice_id") 
  REFERENCES "invoices"("tenant_id", "id") 
  ON DELETE CASCADE;

-- Example: An order cannot reference another tenant's customer
ALTER TABLE "orders" 
  ADD CONSTRAINT "orders_tenant_id_customer_id_fkey" 
  FOREIGN KEY ("tenant_id", "customer_id") 
  REFERENCES "customers"("tenant_id", "id") 
  ON DELETE RESTRICT;
```

If an attacker attempts to inject an order with `tenant_id = Tenant_A` but `customer_id = Tenant_B_Customer`, PostgreSQL rejects the write with a foreign key violation (`P2003`), providing structural relational defense in depth.
