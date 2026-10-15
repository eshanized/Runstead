# Runstead — Release, Operations & Integration Boundaries

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Document Baseline**: Phase 0 (October 2026)  
> **Status**: Authoritative Operational Baseline

---

## 1. Operational Environments & Runtime Assumptions

Runstead defines three operational deployment tiers with explicit behavioral boundaries:

| Environment | Host Infrastructure | Persistence Engine | Upstream Providers | Intended Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Local Development** | Developer Workstation (`localhost:3000`) | Client-side `localStorage` (`runstead_demo_v3`) | Simulated & In-Memory Mocks | Rapid feature iteration, unit tests, local E2E journeys. |
| **Staging / Preview** | Vercel Edge / Dedicated Docker Node | Managed PostgreSQL (Sandbox instance) | Upstream Sandboxes (cPanel sandbox, Stripe testmode, ResellerClub testbed) | Integration verification, pull request previews, chaos drills. |
| **Production** | Distributed Edge Network (Vercel / Cloudflare) | Multi-AZ PostgreSQL with Connection Pooling | Live Upstream APIs with Encrypted Credentials | Commercial operations, live billing, customer hosting management. |

---

## 2. Integration Maturity Classification Framework

To eliminate ambiguous claims where a mock UI is mislabeled as an integrated capability, every external integration is governed by a **6-State Maturity Model**:

```
[Simulated] ──> [Designed] ──> [In Development] ──> [Implemented] ──> [Verified] ──> [Available in Release]
```

### Criteria to Advance Between States:
1. **Simulated → Designed**: Requires a documented ADR, TypeScript interface definition, error mapping schema, and webhook payload specification.
2. **Designed → In Development**: Working driver branch created with live mock servers or sandbox credentials.
3. **In Development → Implemented**: Concrete driver code compiles cleanly with 0 type errors and handles all required lifecycle actions.
4. **Implemented → Verified**: Automated contract tests pass against a live provider sandbox with 100% test pass rate in CI, including retry and error injection.
5. **Verified → Available in Release**: Driver published in a signed production release with operational runbooks, credential encryption, and customer documentation.

### Current Inventory of System Integrations:

| Provider / Subsystem | Category | Current State | Required Evidence for Next State | Target Phase |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub REST Telemetry** | Metrics & Progress | **Verified** | Production verification against `eshanized/Runstead` with in-memory caching complete. | Phase 0 (Active) |
| **Stripe Billing & Invoicing** | Payments | **Simulated** | Connect real Stripe Elements and Webhook signature verification. | Phase 4 |
| **cPanel / WHM XML-API** | Hosting Provisioning | **Simulated** | Implement `WHMDriver` executing against live WHM test server. | Phase 14 |
| **Plesk REST API** | Hosting Provisioning | **Simulated** | Implement `PleskDriver` with account create/suspend calls. | Phase 15 |
| **ResellerClub / Enom EPP** | Domain Registrar | **Simulated** | Connect to registrar sandbox with live EPP socket / REST call. | Phase 16 |
| **Cloudflare / PowerDNS API** | Authoritative DNS | **Simulated** | Execute zone push and verify public DNS propagation with `dig`. | Phase 17 |
| **Let's Encrypt / ACME** | SSL Orchestration | **Simulated** | Automate DNS-01 challenge issuance against ACME staging server. | Phase 18 |
| **Postmark / Resend** | Transactional Mail | **Simulated** | Connect verified SMTP/API key and verify SPF/DKIM delivery. | Phase 20 |

---

## 3. Operational Health, Logging & Failure Recovery

### 3.1 Health & Readiness Probes
- Production deployments must expose:
  - `/api/health/live`: Fast liveness check returning HTTP 200 if the Next.js process is responsive.
  - `/api/health/ready`: Deep readiness probe checking database connectivity, Redis queue availability, and cache status.

### 3.2 Structured Logging & Error Reporting
- All server-side route handlers and background jobs must emit structured JSON log entries:
  ```json
  {
    "timestamp": "2026-10-15T08:52:18.000Z",
    "level": "error",
    "event": "provisioning.failure",
    "tenant_id": "8f3b2e10-...",
    "service_id": "srv_4921",
    "provider": "cpanel",
    "error_code": "WHM_QUOTA_EXCEEDED",
    "message": "Disk quota allocation rejected by target hypervisor node",
    "retry_count": 2
  }
  ```
- Sensitive credentials, API keys, customer passwords, and credit card tokens must be automatically masked before writing to log sinks.

### 3.3 Database Backup & Disaster Recovery Standards
- **Recovery Point Objective (RPO)**: < 15 minutes (via continuous Write-Ahead Log archiving).
- **Recovery Time Objective (RTO)**: < 1 hour (automated database restoration to standby region).
- **Automated Verification**: Backup snapshot integrity must be restored and verified in an isolated staging environment weekly.
