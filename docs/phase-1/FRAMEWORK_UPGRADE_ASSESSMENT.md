# Runstead — Phase 1: Framework Upgrade Assessment

> **Project Name**: Runstead  
> **Repository**: [`https://github.com/eshanized/Runstead`](https://github.com/eshanized/Runstead)  
> **Phase**: 1 of 32 (Dependency Hardening & Security Baseline)  
> **Reference Standards**: Next.js Support Policy, React Security Advisories, GitHub Advisory Database  
> **Author**: Core Infrastructure & Security Engineering  
> **Date**: October 15, 2026

---

## 1. Context & Upgrade Trigger

In Phase 0, Runstead was baselined on **Next.js 14.2.35**, **React 18.2.0**, **React DOM 18.2.0**, and strict **TypeScript 5.2.2**.

A fresh security audit revealed that Next.js 14.2.35 is afflicted by **11 critical and high vulnerabilities**, including:
1. `GHSA-9g9p-9gw9-jx7f`: DoS via Image Optimizer remotePatterns configuration.
2. `GHSA-h25m-26qc-wcjf`: Insecure React Server Component HTTP request deserialization DoS.
3. `GHSA-p293-qw3h-jr36`: Unauthenticated Remote Code Execution on windows-hosted environments (`<15.5.24`).
4. `GHSA-2xp9-vwfh-vxw4`: Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are parsed (`<15.5.24`).
5. `GHSA-m99w-x7hq-7vfj` & `GHSA-89xv-2m56-2m9x`: DoS and SSRF in Server Actions.
6. `GHSA-p9j2-gv94-2wf4`: SSRF in rewrites via attacker-controlled destination hostname.
7. `GHSA-36qx-fr4f-26g5`: Middleware / Proxy bypass.

According to the official Next.js Support Policy ([`https://nextjs.org/support-policy`](https://nextjs.org/support-policy)), **Next.js 14.x is officially Unsupported / End of Life** (released October 26, 2023). Patches are no longer released for the Next.js 14 line to address emerging critical remote code execution vectors. 

Therefore, remaining on Next.js 14 is both technically impossible under the zero-critical/high security gate and architecturally unviable for an enterprise hosting platform.

---

## 2. Official Next.js Lifecycle Evaluation

Inspection of the live Next.js support policy confirms the framework release matrix:

| Major Version | Release Date | Official Lifecycle Status | Maintenance Commitment | Target Feasibility |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js 16.x** | October 21, 2025 | **Active LTS** | Features, regular bug fixes, performance, security patches | High churn (requires ESLint 9 Flat Config migration) |
| **Next.js 15.x** | October 21, 2024 | **Maintenance LTS** | Critical bug fixes & essential security updates for 2 years (until Oct 2026) | **Optimal candidate (Patched, stable, React 18 & ESLint 8 compatible)** |
| **Next.js 14.x** | October 26, 2023 | **Unsupported (EOL)** | None | Blocked (unfixable critical CVEs) |
| **Next.js <=13.x** | October 2022 | **Unsupported (EOL)** | None | Ineligible |

---

## 3. Comparative Version Analysis: Next.js 15.5.28 vs. Next.js 16.4.1

To select the smallest safe upgrade path satisfying the phase objective, both supported versions were evaluated against the Runstead codebase:

### 3.1 Next.js 16.4.1 (Active LTS) Evaluation:
- **Security**: Resolves all CVEs.
- **Node.js Engines**: Requires Node.js `>=20.9.0` (Environment has Node v26.11.1).
- **React Compatibility**: Supports React 18.2.0 and React 19.
- **Blocking Incompatibility**:
  - `eslint-config-next@16.4.1` enforces a strict peer dependency on `eslint@>=9.0.0`.
  - In ESLint 9, legacy `.eslintrc.json` is completely deprecated and removed in favor of `eslint.config.mjs` (Flat Config).
  - Attempting `npm install` with Next.js 16 fails with `ERESOLVE unable to resolve dependency tree` against `eslint@8.57.1`.
  - Migrating to ESLint 9 requires rewriting the entire linting pipeline and re-evaluating rule plugins (`@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`), introducing major scope drift beyond Phase 1 boundaries.

### 3.2 Next.js 15.5.28 (Maintenance LTS) Evaluation:
- **Security**: Resolves all critical and high CVEs. Patched up to version `15.5.28` (backport release specifically shipping all security fixes).
- **Node.js Engines**: Compatible with Node.js `^18.18.0 || ^19.8.0 || >= 20.0.0` (Runs cleanly on current Node v26).
- **React Compatibility**: Officially supports `react: ^18.2.0 || ^19.0.0`. Allows Runstead to remain on verified **React 18.2.0**, avoiding regressions across all 28 Radix UI primitive packages (`@radix-ui/react-*`), `vaul`, `sonner`, and `cmdk`.
- **ESLint Compatibility**: Fully supports `eslint@8.57.1` and `.eslintrc.json` natively without peer dependency conflicts or configuration rewrites.
- **App Router Evolution**: Implements Next.js 15 App Router standards, requiring only one minor compatibility correction in dynamic route page parameter handling (`Promise<{ slug: string }>`).

---

## 4. Architectural Impact & API Changes

### 4.1 Asynchronous Page Parameters (`params` Promise)
In Next.js 15, dynamic route page components in the App Router receive `params` as a `Promise` rather than a synchronous object. 

- **Affected Route**: [`app/solutions/[slug]/page.tsx`](file:///app/solutions/[slug]/page.tsx)
- **Previous Code**:
  ```tsx
  export default function SolutionDetailPage({ params }: { params: { slug: string } }) {
    const solution = solutions.find((s) => s.slug === params.slug);
  ```
- **Upgraded Code**:
  ```tsx
  export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const solution = solutions.find((s) => s.slug === slug);
  ```
- **Validation**: Route compiles statically during SSG (`generateStaticParams`) and renders all 5 solution slugs (`/solutions/freelancers`, `/solutions/agencies`, `/solutions/entrepreneurs`, etc.) with zero runtime errors.

### 4.2 Client Component Hooks (`useParams`, `useSearchParams`)
All interactive client demo routes utilize Next.js navigation hooks (`useParams`, `useSearchParams`):
- `app/demo/checkout/page.tsx`
- `app/demo/dns/page.tsx`
- `app/demo/launch/page.tsx`
- `app/demo/storefront-preview/hosting/[slug]/page.tsx`
- `app/demo/storefront-preview/pages/[slug]/page.tsx`
- `app/demo/storefront-preview/domains/transfer/page.tsx`

In Next.js 15, `useParams()` and `useSearchParams()` retain 100% backwards compatibility in client components wrapped with `'use client'`. All 25 Playwright journeys interacting with these parameters passed with zero regressions.

### 4.3 Static Fetch Caching Defaults
In Next.js 15, `fetch()` requests default to `cache: 'no-store'` unless explicitly cached. Runstead's `/api/project-progress` route handler uses explicit URL query parsing and custom caching via `lib/github/client.ts` with a 10-minute in-memory cache and canonical static snapshot fallback (`lib/github/snapshot.ts`). Telemetry verification confirmed that progress metrics continue functioning identically.

---

## 5. Upgrade Decision & Trade-Off Matrix

| Decision Criteria | Next.js 14.2.35 | Next.js 15.5.28 (Selected) | Next.js 16.4.1 |
| :--- | :--- | :--- | :--- |
| **Zero Critical/High CVEs** | ❌ Fails (11 advisories) | ✅ **Passes (0 advisories)** | ✅ Passes (0 advisories) |
| **Vendor Support Policy** | ❌ Unsupported (EOL) | ✅ **Supported (Maintenance LTS)** | ✅ Supported (Active LTS) |
| **React 18 Peer Compatibility** | ✅ Compatible | ✅ **Compatible** | ⚠️ Partial (Radix peer warnings) |
| **ESLint 8 Config Stability** | ✅ Native | ✅ **Native** | ❌ Incompatible (`eslint >= 9`) |
| **Tailwind 3 Compatibility** | ✅ Native | ✅ **Native** | ⚠️ Complex migration |
| **Regression Scope** | Zero | **Minimal (1 file, 3 lines)** | High (Config rewrite, lint rewrite) |
| **Phase 1 Boundary Compliance** | N/A | **100% Compliance** | Scope Drift |

### Formal Recommendation:
Adopt **Next.js 15.5.28** with **React 18.2.0** and **ESLint 8.57.1**. This satisfies all security and vendor support criteria while strictly obeying the non-drift boundary of Phase 1.
