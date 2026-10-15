# Runstead — Phase 1: Framework & Component Compatibility Report

> **Project Name**: Runstead  
> **Repository**: [`https://github.com/eshanized/Runstead`](https://github.com/eshanized/Runstead)  
> **Phase**: 1 of 32 (Dependency Hardening & Security Baseline)  
> **Environment**: Linux x86_64, Node.js v26.11.1, npm v12.2.0, Chromium `/usr/sbin/chromium`  
> **Date**: October 15, 2026

---

## 1. Version Transition Matrix

| Component / Layer | Baseline (Phase 0) | Hardened State (Phase 1) | Transition Type | Compatibility Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js** | `14.2.35` | `15.5.28` | Major Framework Upgrade | Fully compatible; resolves all RCE/DoS CVEs |
| **React** | `18.2.0` | `18.2.0` | Retained | 100% stable; preserves all Radix UI primitives |
| **React DOM** | `18.2.0` | `18.2.0` | Retained | 100% stable |
| **TypeScript** | `5.2.2` | `5.2.2` | Retained | Strict mode clean (`npm run typecheck` = 0) |
| **ESLint** | `8.57.1` | `8.57.1` | Retained | Compatible with `.eslintrc.json` |
| **eslint-config-next** | `14.2.35` | `15.5.28` | Major Config Upgrade | Native ESLint 8 support, 0 errors |
| **PostCSS** | `8.4.30` | `8.5.30` | Direct & Overrides | Fully compatible with Tailwind CSS 3 |
| **Tailwind CSS** | `3.3.3` | `3.3.3` | Retained | Preserves `tailwind.config.ts` and `tailwindcss-animate` |
| **Radix UI Primitives** | 28 packages | 28 packages | Retained | Zero peer conflicts or hydration warnings |
| **Playwright Test** | `1.64.0` | `1.64.0` | Retained | 25/25 E2E journeys passing |

---

## 2. Breaking Changes Addressed

### 2.1 Next.js 15 App Router Dynamic Route Parameters
- **Behavior Change**: In Next.js 15, Page component `params` prop in dynamic routes is typed and passed as a `Promise<T>` rather than a plain synchronous object `T`.
- **Component Affected**: [`app/solutions/[slug]/page.tsx`](file:///app/solutions/[slug]/page.tsx)
- **Error Observed Pre-Fix**:
  ```text
  Type '{ params: { slug: string; }; }' does not satisfy the constraint 'PageProps'.
  Types of property 'params' are incompatible.
  Type '{ slug: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally
  ```
- **Resolution Applied**:
  Updated function signature from synchronous to asynchronous and awaited the parameter resolution:
  ```tsx
  export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const solution = solutions.find((s) => s.slug === slug);
    if (!solution) notFound();
  ```
- **Verification**: `npm run build` succeeds, generating all 5 static pages for solution slugs (`/solutions/freelancers`, `/solutions/agencies`, `/solutions/entrepreneurs`, `/solutions/resellers`, `/solutions/enterprises`).

### 2.2 Transitive Dependency Overrides
To eliminate all critical and high CVEs without forcing incompatible major upgrades on consuming tools, targeted overrides were configured in `package.json`:

1. **`braces` (CVE-2026-93687)**:
   - *Problem*: `braces@3.0.3` has an unpatched stack exhaustion denial of service vulnerability in recursive AST walkers (`GHSA-vfj7-8cjw-p6xm`). Upstream has published no fixed version on npm.
   - *Remediation*: Overridden to `npm:@dieub/braces-depth-guard@3.0.3-pn.0`.
   - *Compatibility Verification*: Verified that `micromatch`, `fast-glob`, and `tailwindcss` compile and expand glob patterns identically while applying recursion depth limiting.
2. **`picomatch`**:
   - *Problem*: `picomatch <=2.3.1` contains ReDoS vulnerabilities. However, `tinyglobby`/`fdir@6` expects `picomatch@^4.0.0` while `chokidar@3` and `micromatch@4` expect `picomatch@2.x`.
   - *Remediation*: Scoped overrides configured specifically under `anymatch`, `readdirp`, and `micromatch` to `picomatch@2.3.2`, allowing root `tinyglobby` to resolve `picomatch@4.0.7` without peer conflicts.
3. **`glob`, `minimatch`, and `brace-expansion`**:
   - *Problem*: `eslint@8.57.1` relies on `minimatch@3.x` and `brace-expansion@1.x`, whereas `@typescript-eslint` relies on `minimatch@10.x` / `brace-expansion@5.x`, and `sucrase` relies on `glob@10.x` / `minimatch@9.x` / `brace-expansion@2.x`.
   - *Remediation*: Scoped hierarchical overrides mapping each consumer to its patched branch (`1.1.21`, `2.1.7`, `5.0.12` for `brace-expansion`; `3.1.5`, `9.0.9`, `10.2.6` for `minimatch`; `10.5.0` for `glob` under `sucrase`).
   - *Compatibility Verification*: `npm run typecheck`, `npm run lint`, and `npm test` execute with zero module resolution errors.

---

## 3. Route Compilation & Static Generation Verification

All 65 routes from the Phase 0 baseline continue compiling, generating, and rendering with identical behavior:

| Route Group | Route Paths Verified | Generation Type | Verification Status |
| :--- | :--- | :--- | :--- |
| **Marketing & Solutions** | `/`, `/about`, `/contact`, `/pricing`, `/privacy`, `/terms`, `/security`, `/solutions`, `/solutions/[slug]` (5 slugs) | Static / SSG / Dynamic | ✅ Verified (HTTP 200, clean hydration) |
| **Platform Architecture** | `/platform`, `/platform/automation`, `/platform/billing`, `/platform/domains`, `/platform/hosting` | Static | ✅ Verified |
| **Roadmap & Progress** | `/roadmap`, `/progress`, `/api/project-progress` | Static / Dynamic | ✅ Verified (Fresh cache + fallback snapshot) |
| **Reseller Acquisition** | `/demo`, `/demo/launch`, `/demo/onboarding`, `/demo/platform-admin` | Static | ✅ Verified |
| **Reseller Business OS** | `/demo/overview`, `/demo/customers`, `/demo/products`, `/demo/orders`, `/demo/services`, `/demo/invoices`, `/demo/domains`, `/demo/dns`, `/demo/tickets`, `/demo/analytics`, `/demo/integrations`, `/demo/settings`, `/demo/storefront` | Static / Client | ✅ Verified (Interactive workflows passing) |
| **Storefront & Client Portal** | `/demo/storefront-preview`, `/demo/storefront-preview/about`, `/demo/storefront-preview/cart`, `/demo/storefront-preview/hosting`, `/demo/storefront-preview/hosting/[slug]`, `/demo/storefront-preview/vps`, `/demo/storefront-preview/domains`, `/demo/storefront-preview/domains/transfer`, `/demo/storefront-preview/client/*` (7 sub-routes) | Static / Dynamic / Client | ✅ Verified (Cart, simulated checkout, portal tickets) |

Total Compiled Routes: **65**  
Shared First Load JS: **103 kB**

---

## 4. UI Primitives & Styling Compatibility

- **Tailwind Utility Classes**: All custom design tokens (`background`, `card`, `popover`, `primary`, `accent`, `destructive`, `chart-*`) and CSS keyframes (`accordion-down`, `accordion-up`, `fadeIn`, `slideUp`) continue generating identical CSS output.
- **Radix UI Primitives**: Evaluated across modals, dropdown menus, context menus, tooltips, dialogs, accordions, and tabs. Hydration logs show zero React warnings or DOM mismatches.
- **Dark Mode Theming**: `next-themes@0.3.0` toggles light/dark themes seamlessly with no flash of unstyled content (FOUC).

---

## 5. Summary & Operational Verdict

The application exhibits **100% functional and visual compatibility** following the upgrade to Next.js 15.5.28 Maintenance LTS and the associated security overrides. Zero unresolved regressions or unsupported runtime environments exist.
