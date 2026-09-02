# Runstead — GitHub Live Progress & Delivery Forecast Integration Guide

> **Target Repository**: [`https://github.com/eshanized/Runstead`](https://github.com/eshanized/Runstead)  
> **Route**: [`/progress`](file:///app/progress/page.tsx)  
> **API Endpoint**: [`/api/project-progress`](file:///app/api/project-progress/route.ts)

This document provides complete operational, architectural, and contributor instructions for Runstead's transparent development tracking engine.

---

## 1. Architectural Overview

The Runstead public progress system derives project health and delivery projections directly from GitHub metadata without manual metric entry or visual mockups.

```
┌────────────────────────────────┐
│   GitHub REST API & Webhooks   │
│   (Issues, Milestones, CI)     │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│      lib/github/client.ts      │ ◄── In-Memory Cache (TTL: 10m)
│    Data Fetching & Fallbacks   │ ◄── Canonical Snapshot Fallback
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│   lib/github/calculations.ts   │ ── Overall Task Completion %
│       lib/github/forecasting.ts│ ── Effort-Weighted Progress %
│    Pure Mathematical Modules   │ ── Historical Velocity & Forecast
└───────────────┬────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌───────────────┐ ┌──────────────────────┐
│  /progress    │ │ /api/project-progress│
│  UI Dashboard │ │ Server REST Endpoint │
└───────────────┘ └──────────────────────┘
```

### Core Architecture Layers:
1. **GitHub API Client (`lib/github/client.ts`)**: Handles authenticated/anonymous REST API access, paginated issue traversal, request timeouts (8s), rate-limit tracking, and in-memory caching.
2. **Data Normalization**: Cleans and validates raw GitHub issue payloads, filtering out pull requests, non-roadmap issues, and duplicate issue IDs.
3. **Pure Calculation Engine (`lib/github/calculations.ts`)**: Pure functions computing task-completion numerators/denominators, effort-weighted metrics, milestone aggregation, and release readiness.
4. **Pure Forecasting Engine (`lib/github/forecasting.ts`)**: Pure mathematical module estimating velocity over a rolling 6–8 week window, computing uncertainty factors, and gating projection confidence.
5. **Canonical Baseline Snapshot (`lib/github/snapshot.ts`)**: Verifiable snapshot of the 42 project deliverables. Ensures that if the GitHub API is temporarily rate-limited, unreachable, or unconfigured, the application never shows false 0% metrics or crashes.
6. **Public Web Dashboard (`app/progress/page.tsx`)**: High-performance dashboard featuring responsive milestone cards, interactive search/filters, evidence inspection, and live commit feeds.
7. **Homepage Summary (`components/marketing/development-summary.tsx`)**: Embedded banner summarizing current milestone, completion rate, and delivery window.

---

## 2. GitHub Source-of-Truth Model

Every planned, user-visible development deliverable is tracked as a GitHub issue in `eshanized/Runstead`.

### 2.1 Label Taxonomy

All roadmap issues adhere to the following taxonomy:

| Label Category | Label Name | Color | Description |
| :--- | :--- | :--- | :--- |
| **Roadmap** | `roadmap` | `#ec4899` | **Mandatory**. Only issues with this label contribute to roadmap completion. |
| **Work State** | `status:planned` | `#64748b` | Scheduled for a future milestone. |
| | `status:in-progress`| `#3b82f6` | Currently being actively coded. |
| | `status:blocked` | `#ef4444` | Blocked on an external dependency, provider credential, or upstream blocker. |
| | `status:in-review` | `#a855f7` | Pull request opened or peer review in progress. |
| | `status:completed` | `#10b981` | Deliverable verified and issue closed. |
| **Work Category**| `type:feature` | `#06b6d4` | User-visible or architectural capability. |
| | `type:bug` | `#f43f5e` | Defect or regression requiring resolution. |
| | `type:security` | `#f59e0b` | Security hardening, vulnerability fix, or access-control audit. |
| | `type:testing` | `#10b981` | Unit test suite, integration harness, or Playwright E2E journey. |
| | `type:documentation` | `#8b5cf6` | Architectural specifications, README, or operating guide. |
| | `type:infrastructure` | `#6366f1` | CI/CD pipeline, hypervisor connector, or DNS edge network. |
| **Effort Points** | `estimate:1` | `#cbd5e1` | 1 point — Trivial configuration or minor string fix. |
| | `estimate:2` | `#94a3b8` | 2 points — Small UI tweak or isolated utility function. |
| | `estimate:3` | `#64748b` | 3 points — Standard component or self-contained feature. |
| | `estimate:5` | `#475569` | 5 points — Complex module, multi-file workflow, or state machine. |
| | `estimate:8` | `#334155` | 8 points — Major subsystem, external API integration, or driver. |
| | `estimate:13`| `#1e293b` | 13 points — Architectural overhaul or deep multi-service subsystem. |

---

## 3. Native Milestones

Runstead groups tasks into 6 delivery stages derived from our product architecture:

1. **`M1: Foundation & Reseller Architecture`**: Core multi-tenant models, seeded demo state, auth foundations, and platform operator console.
2. **`M2: Core Platform & Business Workflows`**: Customer CRM, recurring invoices, product catalog, support ticketing, and business analytics.
3. **`M3: Customer Experience & Storefront`**: White-label storefront editor, live preview, multi-item cart, and self-service customer portal.
4. **`M4: Provisioning & Automation Engine`**: Service lifecycle state machine, automated hypervisor/DNS provisioning, and upstream cPanel/WHM connectors.
5. **`M5: Domain Commerce & DNS Network`**: RFC DNS zone editor, registrar API connector abstraction, and automated Let's Encrypt SSL orchestration.
6. **`M6: Security, Enterprise & Release Readiness`**: Public progress dashboard, GitHub CI/CD pipeline, PostgreSQL persistence adapter, and v1.0 production release.

---

## 4. Progress & Forecast Calculations

### 4.1 Overall Task Completion
$$\text{Task Completion \%} = \frac{\text{Eligible Closed Roadmap Tasks}}{\text{Eligible Closed Tasks} + \text{Eligible Open Tasks}} \times 100$$
- Pull requests returned by GitHub Issues API are strictly filtered out.
- Issues lacking the `roadmap` label are excluded.
- If total tasks equal 0, the system reports an explicit empty state (`hasRoadmap: false`), never a misleading `0%`.

### 4.2 Effort-Weighted Completion
$$\text{Effort Completion \%} = \frac{\text{Completed Estimated Effort Points}}{\text{Total Estimated Effort Points}} \times 100$$
- Unestimated tasks are tracked separately (`unestimatedTaskCount`).
- The dashboard displays coverage: `Effort estimates available for X% of roadmap tasks`.
- Unknown effort is never silently treated as zero or assigned invented weights.

### 4.3 Historical Velocity & Forecasting Formula
$$\text{Weekly Velocity} = \frac{\sum \text{Effort Points of Tasks Closed within Window}}{\text{Observation Window Weeks (default: 8 weeks)}}$$

$$\text{Baseline Weeks Remaining} = \frac{\text{Remaining Estimated Effort Points}}{\text{Weekly Velocity}}$$

#### Uncertainty Range:
- **Min Weeks (Optimistic)**: $\text{Baseline} \times 0.8$
- **Max Weeks (Pessimistic / Risk Buffer)**: $\text{Baseline} \times 1.4$
- **Target Delivery Window**: $[\text{CurrentDate} + \text{MinWeeks}, \text{CurrentDate} + \text{MaxWeeks}]$

#### Data Sufficiency & Confidence Gating:
The forecast module returns `isCalculable: false` with the reason `"Not enough development history to estimate a reliable delivery window"` if:
- Velocity is 0 or no tasks were closed within the observation window.
- Fewer than 10 completed effort points exist in the window.
- Remaining task estimate coverage is below 50%.
- Reopened tasks are strictly excluded from completed points.

---

## 5. Verified Release Readiness

Release readiness is decoupled from development progress. A project with 95% task completion is **not** release-ready if critical checks fail:

| Audit Check | Evidence Source | Requirement for Release Readiness |
| :--- | :--- | :--- |
| **Automated Test Suite** | `tests/*.test.ts` (30/30) | 100% passing tests in Node.js test runner |
| **End-to-End Suite** | `tests/e2e/*.spec.ts` | 100% passing Playwright journeys |
| **Static Analysis** | `npm run typecheck && npm run lint` | 0 TypeScript errors, 0 ESLint errors |
| **Production Build** | `npm run build` | 65/65 static & server routes compiled cleanly |
| **Security Audit** | Code inspection & tenant isolation | 0 unresolved critical CVEs, tenant boundaries isolated |
| **Critical Blockers** | Issues labeled `status:blocked` | 0 active blocked deliverables |
| **Published Release** | GitHub Releases API | Formal signed git tag (e.g. `v1.0.0`) |

---

## 6. Environment Variables & Caching

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `GITHUB_REPO_OWNER` | `eshanized` | GitHub repository owner/organization. |
| `GITHUB_REPO_NAME` | `Runstead` | GitHub repository name. |
| `GITHUB_TOKEN` | *Optional* | Read-only Personal Access Token (PAT) for 5,000 req/hr rate limits. |
| `GH_TOKEN` | *Optional* | Alternative token variable used by GitHub CLI and Actions. |
| `PROGRESS_CACHE_TTL_SECONDS` | `600` | In-memory cache duration (default: 10 minutes). |

### Caching Strategy:
- **Server Cache**: In-memory cache with 10-minute TTL prevents duplicate requests from concurrent visitors.
- **Debounced Fetch**: Concurrent visitors share a single in-flight Promise.
- **HTTP Cache Headers**: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.
- **Offline / Error Fallback**: If GitHub is unreachable or rate-limited, the system serves the last cached snapshot flagged with `isStale: true` and an informative message, falling back to `lib/github/snapshot.ts`.

---

## 7. Contributor Workflow

### How to Add a Deliverable to the Roadmap:
1. Open an issue on GitHub using the **Feature Deliverable** or **Release Readiness** template.
2. Assign the `roadmap` label.
3. Assign a work category: `type:feature`, `type:bug`, `type:security`, `type:testing`, `type:infrastructure`, or `type:documentation`.
4. Assign an initial state: `status:planned` (or `status:in-progress` if work has begun).
5. Assign an effort point label: `estimate:1`, `estimate:2`, `estimate:3`, `estimate:5`, `estimate:8`, or `estimate:13`.
6. Assign the target milestone (`M1` through `M6`).
7. Once merged and verified with automated tests, close the issue and record evidence.

### Automated Setup Script:
Run the provided idempotent shell script to configure labels and milestones:
```bash
chmod +x scripts/setup-github-roadmap.sh
./scripts/setup-github-roadmap.sh
```

---

## 8. Verification Commands

Run static checks and automated tests locally:
```bash
# Typecheck
npm run typecheck

# ESLint
npm run lint

# Node.js Unit & Workflow Suites (52 tests across 7 suites)
npm test

# Production Build
npm run build

# Playwright E2E Suite (10 progress dashboard journeys)
npx playwright test tests/e2e/progress-dashboard.spec.ts
```
