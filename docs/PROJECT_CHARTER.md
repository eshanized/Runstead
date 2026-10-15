# Runstead — Project Charter & Product Scope

> **Project Name**: Runstead  
> **Sponsoring Organization**: Tonmoy Infrastructure  
> **Canonical Repository**: [`https://github.com/eshanized/Runstead`](https://github.com/eshanized/Runstead)  
> **Document Baseline**: Phase 0 (October 2026)  
> **Status**: Authoritative Product Baseline

---

## 1. Executive Vision & Mission

Runstead is a modern, unified operating system engineered specifically for hosting businesses.

The global hosting industry remains encumbered by legacy software architectures (principally WHMCS) and fragmented toolsets. Operating a modern hosting company currently demands stitching together disparate portals: one for client billing, an unintegrated panel for support tickets, manual web consoles for registrar domain procurement, disjointed DNS tools, and unbranded, outdated customer self-service portals.

**Runstead's mission is to replace this fragmented sprawl with a cohesive, developer-friendly, and investor-ready platform that unifies customer management, product catalogs, automated recurring billing, service lifecycle provisioning, domain and DNS operations, multi-channel support, and white-label customer storefronts.**

---

## 2. Target Users & Market Segments

Runstead addresses five distinct user personas across four primary business segments:

### 2.1 User Personas

1. **Hosting Business Owner / Executive**: Requires executive KPI telemetry, Monthly Recurring Revenue (MRR) tracking, churn metrics, reseller plan usage visibility, and business setting governance.
2. **Billing Clerk / Financial Administrator**: Manages multi-cycle catalog pricing, tax rates, automated recurring invoices, payment reconciliation, refunds, and line-item audits.
3. **Support & Operations Staff**: Operates the centralized multi-channel ticketing queue, communicates with end customers, adds private internal triage notes, and executes lifecycle operations on services.
4. **End Customer / Tenant Client**: Browses published reseller storefronts, orders hosting and domains through multi-item checkout, pays invoices, manages DNS records, and requests support via a self-service portal.
5. **Platform Fleet Operator (Tonmoy Infrastructure)**: Manages global multi-tenant fleet health, monitors reseller SaaS subscriptions, enforces compute and disk quotas, and oversees hypervisor node capacity.

### 2.2 Business Segments

- **Freelance Web Developers**: Seeking turn-key client hosting with automated billing and custom-branded client portals.
- **Digital Agencies**: Managing multi-tier customer sites with consolidated billing, team access, and reseller hosting accounts.
- **Hosting Entrepreneurs & Startups**: Bootstrapping an independent hosting brand without investing hundreds of engineering hours in legacy billing panel integrations.
- **Established Hosting Providers**: Modernizing legacy WHMCS installations with a fast, modern Next.js/React interface and modern API automation.

---

## 3. The Three Architectural Horizons

Runstead enforces clear conceptual and technical boundaries between three evolutionary platform horizons:

```
┌─────────────────────────────────────────────────────────────────┐
│        HORIZON A: HOSTING-BUSINESS OPERATING PLATFORM           │
│   Client CRM • Catalog • Invoicing • Support • Storefronts      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│        HORIZON B: AUTOMATION & INTEGRATION LAYER                │
│  Provisioning Pipeline • cPanel/Plesk Adapters • EPP • Stripe   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│        HORIZON C: OWNED INFRASTRUCTURE PLATFORM                 │
│  Bare-Metal Hypervisors • BIND Anycast Cluster • S3 Dedupe      │
└─────────────────────────────────────────────────────────────────┘
```

### Horizon A: Hosting-Business Operating Platform (Primary Immediate Scope)
The commercial and business layer:
- Multi-tenant client CRM and organization accounts.
- Flexible multi-cycle catalog (Shared, VPS, Dedicated, Domains, Add-ons).
- Order processing state machine (`awaiting_payment` → `paid` → `provisioning` → `active`).
- Automated invoice calculation, taxes, line-items, and simulated payment workflows.
- Multi-channel support ticket queues with internal notes.
- Real-time WYSIWYG storefront visual builder with live preview and custom pages.
- Client self-service portal for services, domains, invoices, and helpdesk.

### Horizon B: Automation & Integration Layer (Mid-Term Scope)
The connector and orchestration layer linking business events to external providers:
- Asynchronous resilient job queue with retries, exponential backoffs, and dead-letter queues.
- Standardized Driver Adapters for upstream control panels:
  - cPanel / WHM (XML-API / UAPI)
  - Plesk (REST API)
  - DirectAdmin (CMD_API)
- Registrar API Connectors for automated domain registrations, transfers, and nameserver updates (ResellerClub, Enom, Namecheap).
- Payment Gateway Integration: Stripe Checkout, Payment Intents, and Webhook settlement.
- DNS Edge Synchronization: Cloudflare and PowerDNS API connectors.
- Automated Let's Encrypt / ACME SSL certificate issuance and renewal.

### Horizon C: Owned Infrastructure Platform (Long-Term Horizon)
Future deep infrastructure capabilities developed by Tonmoy Infrastructure:
- Native bare-metal hypervisor node orchestration (KVM/QEMU, microVMs).
- Native containerized shared hosting control panel (replacing upstream cPanel licensing).
- Authoritative globally distributed Anycast DNS network.
- Deduplicated block and object backup storage engine with point-in-time recovery.

---

## 4. Key Product Principles

1. **Evidence Over Demonstration**: Software functionality must be verifiable through automated unit, integration, or end-to-end tests. Demonstrations and simulations must be explicitly marked as such.
2. **Strict Multi-Tenant Isolation**: Tenant boundaries must be inviolable across database rows, API endpoints, cached sessions, background workers, and exports.
3. **Resilient Failure Handling**: Infrastructure actions (provisioning, suspension, DNS updates) are inherently failure-prone. Systems must expose idempotent retries, observable statuses, and audit histories.
4. **Zero Vendor Lock-In**: Storefront themes, DNS records, customer records, and product definitions must use open JSON schemas and standardized RFC formats.
5. **Performance & Developer Experience**: Modern Next.js App Router architecture, strict TypeScript typing, sub-second route navigation, and accessible UI primitives.

---

## 5. Scope Boundaries

### In-Scope for Initial Production Deliverables (Milestones 1–6 / Core Roadmap)
- Conversion of demo state store to server-side PostgreSQL with Row-Level Security (RLS).
- Production session authentication with email/password and multi-factor authentication (MFA).
- Concrete Stripe billing integration with webhook signature verification.
- Production cPanel/WHM provisioning adapter with automated account suspension and restoration.
- RFC-compliant DNS zone manager synchronized to an external DNS provider API.
- Live delivery tracking and GitHub telemetry dashboard (`/progress`).

### Explicitly Deferred Capabilities (Future Phases)
- Proprietary hypervisor kernel modules or custom Linux virtualization daemons.
- Direct credit card processing bypassing PCI-DSS compliant third-party gateways (Stripe/Paddle).
- ICANN-accredited domain registry operations (reseller integrations only in initial phases).
- Desktop client applications or native mobile apps (responsive mobile web priority).

---

## 6. Success Criteria & Assumptions Requiring Validation

### 6.1 Success Criteria
- **Functional Completeness**: A reseller can register, configure their catalog, launch a storefront, receive an order, process payment, and automatically provision a cPanel account without manual intervention.
- **Reliability Target**: 99.9% uptime for customer-facing storefronts and client portals.
- **Test Integrity**: 100% pass rate maintained across all unit, workflow, and Playwright suites in CI.
- **Zero Critical Vulnerabilities**: Elimination of all critical and high-severity dependencies before v1.0 release.

### 6.2 Key Assumptions Requiring Validation
- Resellers prioritize cPanel/WHM support over Plesk or DirectAdmin for initial migrations.
- Stripe's platform fee and Connect architecture satisfy global reseller tax compliance needs.
- Next.js server-side rendering provides adequate throughput under high storefront traffic spikes without dedicated static site generation (SSG) caching layers.
