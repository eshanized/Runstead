# Runstead — Modern Operating System for Hosting Businesses

> **Start, operate, and grow a hosting business from one platform.**  
> A modern, investor-ready SaaS alternative to WHMCS and fragmented hosting management tools.

Developed by **Tonmoy Infrastructure**.

---

## 1. Executive Summary & Product Positioning

Traditional hosting operations are bogged down by legacy software (such as WHMCS) stitched together with disconnected third-party tools: separate portals for billing, different panels for support ticketing, manual registrar consoles for domain purchases, unintegrated DNS tools, and unbranded customer dashboards.

**Runstead** unifies the entire lifecycle of a hosting business into a single platform:
1. **Business Operating System (Commercial Software)**:
   - Customer and client organization management.
   - Product catalog with configurable resource limits, setup fees, and multi-cycle billing.
   - Automated orders, recurring invoices, and payment tracking.
   - Hosting service lifecycle management (provision, suspend, restore, upgrade, cancel).
   - Domain inventory and authoritative DNS zone editor.
   - Multi-channel support ticket workflows with staff replies and internal notes.
   - White-label customer storefronts with real-time branding preview.
   - Executive analytics, MRR tracking, and churn reporting.
2. **Infrastructure Ecosystem (Long-Term Roadmap)**:
   - Shared hosting node automation.
   - VPS provisioning and virtual infrastructure.
   - Integrated hosting control panel.
   - Registry and domain commerce.
   - Authoritative DNS cluster.
   - Automated SSL certificate provisioning and lifecycle renewal.
   - Deduplicated cloud storage and point-in-time backup recovery.

> [!NOTE]  
> **Investor Demonstration Notice**: This repository contains the complete frontend website, design system, and an interactive browser-first simulation of the Runstead platform. It does not execute real credit card charges, propagate changes to public DNS root servers, or spin up physical servers.

---

## 2. Technology Stack & Architecture

- **Framework**: Next.js 13+ (App Router with React Server Components & Client Boundaries)
- **Language**: Strict TypeScript throughout
- **Styling**: Tailwind CSS with custom design tokens, dark surfaces, and coral-red accent (`#f43f5e`)
- **UI Components**: Accessible components built on Radix UI primitives and custom accessible implementations
- **Icons**: Lucide React
- **Data Visualizations**: Recharts for revenue trends, customer growth, sales distribution, and resource metrics
- **Notifications**: Sonner toast system with rich colors and status indicators
- **State Management**: Typed Demo State Provider (`lib/demo/store.tsx`) with localStorage persistence, hydration safety, and deterministic seed data restoration
- **Deployment**: Optimized for Vercel and Netlify (`netlify.toml` included)

---

## 3. Public Marketing Website

The public site communicates a clear enterprise narrative, distinguishing currently available demo capabilities from planned product releases and long-term roadmap ambitions.

| Route | Purpose & Highlights |
| :--- | :--- |
| [`/`](file:///app/page.tsx) | Complete homepage with hero, interactive dashboard preview, problem/solution breakdown, 5-step reseller launch workflow, infrastructure vision, audience segments, and indicative pricing preview. |
| [`/platform`](file:///app/platform/page.tsx) | Platform architectural overview showing how business OS, service automation, and infrastructure layers integrate. |
| [`/platform/billing`](file:///app/platform/billing/page.tsx) | Deep dive into customer records, automated billing cycles, invoices, refunds, and reconciliation. |
| [`/platform/automation`](file:///app/platform/automation/page.tsx) | Visual explanation of the service lifecycle, retry handling, failure visibility, and job reconciliation. |
| [`/platform/domains`](file:///app/platform/domains/page.tsx) | Domain search, registrar integration capabilities, external domain mapping, and DNS zone management. |
| [`/platform/hosting`](file:///app/platform/hosting/page.tsx) | Vision for shared hosting, VPS provisioning, control panels, and the roadmap to owned infrastructure. |
| [`/solutions`](file:///app/solutions/page.tsx) | Solutions hub with dedicated routes: [Freelancers](file:///app/solutions/%5Bslug%5D/page.tsx), [Agencies](file:///app/solutions/%5Bslug%5D/page.tsx), [Entrepreneurs](file:///app/solutions/%5Bslug%5D/page.tsx), [Existing Hosts](file:///app/solutions/%5Bslug%5D/page.tsx), and [Infrastructure](file:///app/solutions/%5Bslug%5D/page.tsx). |
| [`/pricing`](file:///app/pricing/page.tsx) | Indicative pricing model: Sandbox (Free), Launch ($49/mo), Growth ($149/mo), Scale ($399/mo), Enterprise (Custom), with monthly/annual toggle, feature comparison, FAQ, and plan handoff to `/demo/launch`. |
| [`/integrations`](file:///app/integrations/page.tsx) | Directory of 8 provider categories with explicit statuses: `demo`, `planned`, `available`, `roadmap`. |
| [`/security`](file:///app/security/page.tsx) | Architectural security principles: tenant isolation, RBAC, encrypted secrets, audit logs, and abuse prevention. |
| [`/roadmap`](file:///app/roadmap/page.tsx) | 6 evolutionary stages from SaaS foundation to owned infrastructure and developer APIs. |
| [`/about`](file:///app/about/page.tsx) | Mission, engineering direction, and product philosophy of Tonmoy Infrastructure. |
| [`/contact`](file:///app/contact/page.tsx) | Investor inquiry and partnership contact form with simulated submission and validation. |
| [`/privacy`](file:///app/privacy/page.tsx) | Privacy policy and demonstration data disclosures. |
| [`/terms`](file:///app/terms/page.tsx) | Terms of service and simulated execution guidelines. |
| [`/demo`](file:///app/demo/page.tsx) | Interactive demo launchpad allowing direct access without signups, credentials, or credit cards. |

---

## 4. Interactive Product Demonstration

The `/demo/*` routes run an interactive application shell featuring real state updates, search, filters, pagination, toasts, modal forms, and local persistence.

- **SaaS Acquisition Flow (`/demo/launch`)**: Guided tenant-launch wizard allowing an investor or prospective reseller to select a Tonmoy Infrastructure platform tier (Launch, Growth, Scale), configure their business profile and branding, review an indicative subscription summary, authorize simulated platform billing, instantiate a new tenant context, and transition directly into onboarding or dashboard operations.
- **Platform Operator Console (`/demo/platform-admin`)**: Dedicated Tonmoy Infrastructure fleet administration interface giving operators global visibility into all reseller tenants, subscription tiers, MRR contributions, provisioning usage vs. plan limits, integration health, system alerts, and simulated tenant management (status changes, plan upgrades).
- **Executive Overview (`/demo/overview`)**: Real-time KPI cards (MRR, active clients, services, pending orders, outstanding invoices, upcoming renewals), interactive revenue and customer growth charts, recent activity log, and service health monitors.
- **Global Command Search (⌘K / Ctrl+K)**: Instant keyboard-driven search dialog indexing navigation routes, customers, hosting products, active orders, provisioned services, invoices, and support tickets with direct navigation.
- **Customer Management (`/demo/customers`)**: Search by name/email/company/country, filter by status, sort columns, pagination, add new customer modal with validation, edit profile, safe archival (preserving referential integrity across past orders/invoices), and cross-module inspection tabs (Services, Invoices, Orders).
- **Product Catalog (`/demo/products`)**: Manage hosting products (Shared Hosting, VPS, Domains, DNS, Add-ons), configure multi-cycle pricing and setup fees, toggle availability, edit resource limits, and safe archival.
- **Order Lifecycle (`/demo/orders`)**: State machine supporting transition from `awaiting_payment` &rarr; `paid` &rarr; `provisioning` &rarr; `active`, cancellation handling, and timeline audit logs.
- **Service Management (`/demo/services`)**: Fleet management with status badges, resource usage meters (CPU, RAM, Disk, Bandwidth) with Recharts visualizations, service timeline, dedicated "Upgrade Plan" modal, and atomic lifecycle actions to `Suspend`, `Restore`, or `Cancel`.
- **Domain Inventory (`/demo/domains`)**: Domain management, simulated instant domain availability search and registration, external domain connection, renewal actions, auto-renew switches, and direct DNS jump links.
- **DNS Zone Editor (`/demo/dns`)**: Full zone editor supporting RFC-compliant validation for `A`, `AAAA`, `CNAME`, `MX` (with priority), `TXT`, and `CAA` records, TTL controls, modal creation/edit, and destructive deletion confirmation dialogs.
- **Invoices & Billing (`/demo/invoices`)**: Invoice breakdown with subtotal, tax rate calculations, line items, payment history, modal printable invoice preview, and simulated `Mark Paid`, `Refund`, and `Void` actions with customer balance reconciliation.
- **Support Tickets (`/demo/tickets`)**: Ticket queue filtered by status (`open`, `in_progress`, `resolved`, `closed`) and priority (`low`, `medium`, `high`, `urgent`), "Open New Ticket" modal with customer selection, conversation thread history, staff replies, and internal notes.
- **Analytics & Reporting (`/demo/analytics`)**: Detailed visualizations including 6-month revenue trends, customer acquisition curves, sales distribution by product, service breakdown pie chart, and simulated renewal vs churn ratios.
- **White-Label Storefront Editor (`/demo/storefront`)**: Visual real-time customizer allowing modification of business name, logo text, tagline, primary & accent colors, headlines, and product selection with instant live preview in desktop, tablet, and mobile viewport frames.
- **White-Label Storefront Preview (`/demo/storefront-preview`)**: Customer-facing published storefront preview rendering the active reseller's branding, custom domain lookup, catalog pricing, and functional `Order Now` actions leading into checkout.
- **Customer Checkout & Automated Provisioning (`/demo/checkout`)**: Multi-step customer checkout supporting customer selection or inline new customer registration, itemized tax and setup fee calculations, simulated payment authorization, live 4-step provisioning simulation (hypervisor allocation, cgroup creation, DNS configuration, auto-SSL deployment) with controlled failure/retry demonstration, and service activation.
- **Provider Integrations (`/demo/integrations`)**: Provider connection status management with interactive connection tests (producing `connected`, `degraded`, or `disconnected` results) and masked credential configuration modals.
- **Business Settings (`/demo/settings`)**: Company profile, currency, time zone, tax rate configuration, notification preferences, team member invitations with RBAC roles, and subscription tier selection.
- **Guided Onboarding Wizard (`/demo/onboarding`)**: 7-step guided launcher (Profile &rarr; Category &rarr; Branding &rarr; Products &rarr; Pricing &rarr; Storefront Preview &rarr; Launch Checklist) saving directly into the active demo store.

---

## 5. Quick Start & Local Development

### Prerequisites
- Node.js 18.17+ or 20+ (Node 26 tested)
- npm 9+ or npm 12+

### 1. Install Dependencies
```bash
npm ci
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Static Checks & Linting
```bash
# Verify TypeScript types
npm run typecheck

# Run ESLint
npm run lint
```

### 4. Run Unit Test Suite
```bash
npm test
```
The test suite validates:
- Referential data integrity across all seeded records (`tests/seed-data.test.ts`).
- Deterministic selector functions, searches, and calculations (`tests/selectors.test.ts`).
- Central business workflow layer (`tests/workflows.test.ts`) covering customer lifecycle, product management, order & provisioning lifecycle, service suspension/restore/upgrade, domain/DNS mutations, invoice payments/refunds, support tickets, and SaaS tenant launch.

### 5. Run Browser End-to-End Suite
```bash
npm run test:e2e
```
Executes 11 Playwright automated journeys against the production Next.js build:
1. Marketing site navigation and pricing plan handoff to launch wizard.
2. SaaS Acquisition Journey: Plan &rarr; Profile &rarr; Brand &rarr; Confirm &rarr; Dashboard.
3. Reseller Dashboard Overview and Global Search (Ctrl+K).
4. Customers Management: Filter, safe archive, and cross-module inspection tabs.
5. White-Label Storefront Preview and Interactive Checkout with Automated Provisioning.
6. Services Fleet Management: Inspect, Suspend, Restore, and Upgrade.
7. Invoices Management: Details, line items, and mark paid workflow.
8. DNS Management and RFC Record Validation.
9. Support Tickets: Open new ticket and staff response workflow.
10. Platform Operator Console: Tonmoy Infrastructure Fleet Operations.
11. Credibility and Legal Pages (`/about`, `/privacy`, `/terms`).

### 6. Build for Production
```bash
npm run build
npm run start
```
Compiles and generates all static and dynamic pages with 0 errors, optimized for Vercel deployment.

---

## 6. How an Investor Can Evaluate the Demo

1. **Evaluate the SaaS Acquisition Journey**:
   - Visit [`/pricing`](http://localhost:3000/pricing), select the **"Growth"** tier, and experience the tenant launch wizard at [`/demo/launch`](http://localhost:3000/demo/launch).
2. **Inspect the Platform Operator Console**:
   - Navigate to [`/demo/platform-admin`](http://localhost:3000/demo/platform-admin) to see how Tonmoy Infrastructure monitors tenant growth, subscription MRR, fleet usage limits, and integration status.
3. **Walk Through the Reseller Dashboard**:
   - Check MRR, active service counts, revenue trends, and system status at [`/demo/overview`](http://localhost:3000/demo/overview).
   - Press **⌘K** or **Ctrl+K** anywhere to test the global search palette across demo records.
4. **Test White-Label Storefront Preview & Customer Checkout**:
   - Visit [`/demo/storefront-preview`](http://localhost:3000/demo/storefront-preview), search for a domain, and click **"Order Now"**.
   - Complete checkout at [`/demo/checkout`](http://localhost:3000/demo/checkout) with simulated payment authorization and observe the live 4-step provisioning simulation with controlled failure/retry testing.
5. **Manage Fleet Services & Upgrades**:
   - Go to [`/demo/services`](http://localhost:3000/demo/services), click **"View details"**, and test plan upgrades, suspension, and restoration.
6. **Manage DNS Records**:
   - Open [`/demo/dns`](http://localhost:3000/demo/dns) to add, edit, or delete an `A`, `CNAME`, or `MX` record with strict RFC validation.
7. **Reset Demo Data**:
   - At any time, click **"Reset demo data"** in the sidebar or under the user avatar dropdown to revert all records to pristine seed defaults.

---

## 7. Simulation Boundaries & Business Accuracy

To maintain absolute credibility with investors and partners:
- **No Financial Transactions**: Invoices, credit balances, and payments are local simulations. No real credit cards or bank accounts are debited.
- **No Infrastructure Changes**: DNS zone mutations and server actions are stored in local client state and are never transmitted to external root nameservers or hypervisors.
- **Clear Status Labels**: Every feature is labeled as `demo` (interactive here), `planned` (targeted for version 1.0 release), or `roadmap` (future infrastructure ambition).
- **Indicative Financials**: All pricing figures, MRR metrics, and revenue charts represent sample demonstrative business models and are not representations of past company revenue.
- **Platform vs. Reseller Separation**: Strict separation is maintained between Tonmoy Infrastructure's platform SaaS subscriptions and the reseller's downstream customer hosting invoices.
