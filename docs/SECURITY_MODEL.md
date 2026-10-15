# Runstead — Security Architecture & Threat Model

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Document Baseline**: Phase 0 (October 2026)  
> **Status**: Authoritative Security Baseline & Governance

---

## 1. Security Principles & Trust Boundaries

Runstead is engineered with defense-in-depth principles appropriate for multi-tenant commercial hosting software managing financial transactions, domain registrations, and server control panels.

```
┌─────────────────────────────────────────────────────────────────┐
│                      UNTRUSTED INTERNET                         │
│       (Public Visitors, Browsers, Webhook Senders)             │
└────────────────────────────────┬────────────────────────────────┘
                                 │ TLS 1.3 / HTTPS Only
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ [BOUNDARY 1: Edge & WAF Boundary]                              │
│ - IP Rate Limiting (Cloudflare / Next.js Middleware)            │
│ - DDoS Mitigation & Header Sanitization                         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ [BOUNDARY 2: Application Authentication & RBAC Boundary]        │
│ - Reseller Staff Auth (HTTP-only secure session cookies)        │
│ - Client Portal Customer Auth (Scoped per tenant)               │
│ - Webhook Signature Verification (Stripe HMAC SHA-256)          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ [BOUNDARY 3: Data Isolation Boundary (PostgreSQL RLS)]          │
│ - Database Engine enforces `tenant_id = app.current_tenant_id`  │
│ - Zero cross-tenant relational joins                            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ [BOUNDARY 4: Upstream Infrastructure Connector Boundary]        │
│ - Idempotency Keys on all server mutations                      │
│ - Masked API tokens encrypted at rest (AES-256-GCM)             │
│ - cPanel/WHM, Plesk, EPP Registrar, Stripe Gateways             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Security Controls

### 2.1 Multi-Tenant Isolation
- **The Golden Rule**: No database query, API route, in-memory cache, background job, or data export may access data across tenant boundaries.
- **Enforcement**:
  1. **Relational & Database Engine Level (Phase 2 - Implemented & Verified)**:
     - PostgreSQL Row-Level Security (RLS) policies activated and forced (`FORCE ROW LEVEL SECURITY`) across all 18 tenant-owned tables (`prisma/migrations/20261015081632_init_phase2_schema/migration.sql`).
     - Transaction-scoped tenant context set via `withTenantContext` executing `SELECT set_config('app.current_tenant_id', $1, true)`.
     - PL/pgSQL helper function `current_tenant_id()` safely handles missing, empty, or malformed contexts, evaluating to `NULL` (fail-closed).
     - Composite foreign keys enforce that related child records (Order Items, Invoice Items, DNS records, Ticket Messages) cannot link across tenant boundaries.
     - Unprivileged runtime role (`runstead_app`) is strictly `NOSUPERUSER` and `NOBYPASSRLS`.
     - Verified by 25 automated PostgreSQL integration tests (`tests/db-rls.test.ts`).
  2. **Application Middleware Level (Phase 3+)**: Next.js authentication middleware extracts and cryptographically validates `tenant_id` from trusted session tokens before routing.
  3. **Export Level**: Customer or invoice CSV/JSON exports explicitly filter and bind by `tenant_id`.

### 2.2 Sensitive Subsystem Controls

#### A. Billing & Payment Processing
- **Tokenization**: Runstead never stores raw credit card numbers (PANs) or CVVs in application databases or client local storage. Card processing is offloaded to PCI-DSS Level 1 certified gateways (Stripe Elements / Checkout).
- **Idempotency**: All charge requests dispatch with a unique `idempotency_key` (UUID v4) preventing double billing during network timeouts.
- **Webhook Authenticity & Replay Protection**: Webhook endpoints enforce cryptographic HMAC-SHA256 signature verification and reject timestamps older than 300 seconds.

#### B. Hosting Provisioning & Control Panel Safety
- **Authorization Before Mutation**: Server creation, suspension, restoration, and termination require authenticated staff sessions with appropriate role permissions (`admin` or `support`).
- **Repeat-Safe Execution**: Provisioning jobs are designed to be idempotent. Re-running a failed job checks whether the upstream account already exists before issuing creation commands.
- **Visible Failures**: Provisioning errors are never swallowed. Failures transition the service to `failed_provisioning` or `pending_review` with descriptive, sanitized error logs.

#### C. Domain & DNS Operations
- **Ownership Verification**: DNS record mutations are permitted only if the domain is verified and owned by the requesting customer and tenant.
- **RFC Syntax Sanitization**: To prevent DNS injection or cache poisoning, all record inputs undergo strict RFC validation (rejecting malformed IP addresses, unquoted TXT strings, and illicit characters).

#### D. Secrets Management
- **Zero Secrets in Source Control**: Credentials, private keys, and API tokens are prohibited from git repositories. Phase 0 provides [`.env.example`](file:///home/snigdha/Downloads/hostings/.env.example) with placeholder documentation only.
- **Frontend Bundle Protection**: Only variables explicitly prefixed with `NEXT_PUBLIC_` may be referenced in client components. Server secrets (`GITHUB_TOKEN`, `STRIPE_SECRET_KEY`, database credentials) are restricted to server-side modules (`lib/github/client.ts`, server route handlers).

---

## 3. Threat Model (STRIDE Methodology)

| Threat Category | Specific Attack Vector | Mitigation & Security Architecture | Priority |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates reseller staff or customer to access accounts. | Strong session cookies (HTTP-only, Secure, SameSite=Lax), password bcrypt hashing, MFA support. | High |
| **Tampering** | Attacker tampers with invoice total or checkout prices via client requests. | Server-side price recalculation from authoritative catalog; client-submitted totals are strictly ignored. | Critical |
| **Repudiation** | Staff member deletes customer or cancels server without audit record. | Immutable append-only `audit_events` ledger recording actor ID, IP address, timestamp, and action delta. | High |
| **Information Disclosure** | Cross-tenant data leakage via missing SQL `WHERE` clause. | PostgreSQL Row-Level Security (RLS) enforced at the database engine level. | Critical |
| **Denial of Service** | Flooding public `/api/project-progress` or search routes with requests. | Next.js in-memory caching (10m TTL), Edge IP rate limiting, request debouncing. | Medium |
| **Elevation of Privilege** | Storefront customer attempts to call platform operator endpoints (`/demo/platform-admin`). | Strict role-based access control (RBAC) middleware verifying user tier before route execution. | Critical |

---

## 4. Prioritized Security Risks & Remediation

| Risk ID | Vulnerability / Concern | Supporting Evidence | Severity | Remediation Plan |
| :--- | :--- | :--- | :--- | :--- |
| **RSK-SEC-01** | Transitive dependency vulnerabilities in Next.js, PostCSS, and utilities. | `npm audit` reports 26 vulnerabilities (4 moderate, 21 high, 1 critical). | High | Schedule dedicated dependency audit and upgrade phase (Phase 1 / M6). |
| **RSK-SEC-02** | Client-side state persistence in `localStorage` vulnerable to XSS inspection. | [`lib/demo/store.tsx`](file:///lib/demo/store.tsx) writes demo state to `localStorage`. | Medium | Expected in demo mode; replaced with server-side PostgreSQL and HTTP-only session cookies in Phase 2. |
| **RSK-SEC-03** | Missing server-side rate limiting on public progress API route. | [`app/api/project-progress/route.ts`](file:///app/api/project-progress/route.ts) relies on in-memory TTL without IP throttling. | Low | Implement edge rate-limiting middleware (Upstash Redis or Vercel Edge KV) in Phase 1. |
