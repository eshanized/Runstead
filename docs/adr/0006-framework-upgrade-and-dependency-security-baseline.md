# ADR-0006: Framework Hardening to Next.js 15 Maintenance LTS & Dependency Security Baseline

> **Status**: Accepted  
> **Date**: October 2026  
> **Deciders**: Tonmoy Infrastructure Engineering Core  
> **Technical Scope**: Runtime Framework, Dependency Hardening, Lockfile Governance, CI Security Gates  
> **Supercedes/Updates**: Extends and updates [`docs/adr/0001-runtime-and-application-framework.md`](file:///docs/adr/0001-runtime-and-application-framework.md)

---

## Context

In ADR-0001, Runstead standardized on Next.js 14.2.35 with the App Router, React 18, and strict TypeScript 5.2.2.

During Phase 0, a security baseline audit revealed 26 dependency advisories in the dependency tree. Most critically, Next.js 14.2.35 was affected by 11 high and critical vulnerabilities (including unauthenticated remote code execution via image parsing and Server Actions deserialization DoS). Furthermore, the official Next.js Support Policy officially transitioned the entire Next.js 14 line to **Unsupported / End-of-Life** in October 2024 upon the release of Next.js 15.

To satisfy the non-negotiable Phase 1 exit gate (zero critical or high dependency vulnerabilities) without causing severe regressions to Runstead's 65 compiled routes, 28 Radix UI components, or Tailwind CSS styling tokens, a formal framework and dependency hardening strategy is required.

---

## Decision

We decide to:

1. **Upgrade Next.js and ESLint Config to Version 15.5.28 (Maintenance LTS)**:
   - Next.js 15.x is officially supported under Vercel's 2-year Maintenance LTS commitment through October 2026.
   - Patched release `15.5.28` resolves all known Server Actions SSRF, App Router cache confusion, and Image Optimization RCE advisories.
   - Retains native support for `eslint@8.57.1` and `.eslintrc.json`, avoiding a disruptive and premature ESLint 9 Flat Config migration.

2. **Retain React 18.2.0 and React DOM 18.2.0**:
   - Next.js 15 officially supports `react: ^18.2.0 || ^19.0.0`.
   - Remaining on React 18 protects the integrity of all 28 Radix UI primitives (`@radix-ui/react-*`), `vaul`, `sonner`, `recharts`, and `cmdk`, eliminating hydration mismatches and third-party peer dependency incompatibilities.

3. **Standardize on PostCSS 8.5.30**:
   - Directly upgrade `postcss` to `8.5.30` and enforce via lockfile overrides, eliminating all CSS sourceMappingURL file disclosure and XSS advisories (`GHSA-6g55-p6wh-862q`, `GHSA-r28c-9q8g-f849`, `GHSA-qx2v-qp2m-jg93`).

4. **Apply Audited Scoped Overrides for Transitive Vulnerabilities**:
   - Substitute unpatched `braces@3.0.3` (CVE-2026-93687) with the audited depth-guard drop-in `@dieub/braces-depth-guard@3.0.3-pn.0`.
   - Override `nanoid` (3.3.20), `browserslist` (4.29.3), `cross-spawn` (7.0.6), `flatted` (3.4.4), `js-yaml` (4.3.2), `lodash` (4.18.1), `ws` (8.22.0), `source-map-js` (1.2.2), and `postcss-selector-parser` (7.1.6).
   - Apply scoped overrides for `picomatch`, `glob`, `minimatch`, and `brace-expansion` to isolate toolchains (`eslint` vs `@typescript-eslint` vs `sucrase`) without peer dependency collisions.

5. **Enforce Automated CI Security Auditing**:
   - Introduce `npm audit --audit-level=high` directly into `.github/workflows/ci.yml` immediately following `npm ci`. Any pull request or commit introducing unresolved high or critical vulnerabilities fails the build automatically.

6. **Implement Dependency Update Automation**:
   - Establish `.github/dependabot.yml` configured for weekly npm and GitHub Actions dependency updates with minor/patch grouping and semver-major protection locks.

---

## Alternatives Considered

- **Attempting a 14.2.x Micro-Patch Upgrade**:
  - *Rejected*: Next.js 14 is officially EOL. Critical security advisories (e.g. `GHSA-p293-qw3h-jr36`, `GHSA-2xp9-vwfh-vxw4`) are not patched in Next.js 14.
- **Immediate Upgrade to Next.js 16.4.1 (Active LTS)**:
  - *Rejected*: Next.js 16 requires ESLint 9 (`eslint >= 9.0.0`), which completely removes `.eslintrc.json` support. Forcing an ESLint 9 rewrite and potential React 19 upgrades across 28 UI primitives in Phase 1 represents excessive scope drift and introduces significant regression risk to existing routes.
- **Upgrading to Tailwind CSS 4**:
  - *Rejected*: Upgrading to Tailwind 4 would require migrating away from `tailwind.config.ts` and `tailwindcss-animate`, disrupting verified UI component styling. Overriding `braces` with `@dieub/braces-depth-guard` successfully hardened Tailwind CSS 3 with zero visual drift.

---

## Consequences

- **Positive**:
  - Zero critical, high, moderate, or low dependency vulnerabilities reported by `npm audit` (down from 26 advisories).
  - Framework is backed by Vercel's official Maintenance LTS policy.
  - All 65 application routes compile cleanly into production bundles.
  - All 52 unit tests and 25 Playwright end-to-end tests continue to pass 100%.
  - CI pipeline automatically halts commits introducing severe vulnerabilities.
- **Negative / Risks**:
  - Maintenance LTS for Next.js 15 will conclude in October 2026. A planned migration to Next.js 16 (Active LTS) and ESLint 9 should be scheduled in a subsequent governance or tooling phase after core backend architecture (Phases 2–11) stabilizes.
  - Reliance on scoped package overrides requires lockfile discipline during future package installations.
