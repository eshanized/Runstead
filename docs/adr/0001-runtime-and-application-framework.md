# ADR-0001: Next.js App Router and TypeScript Runtime Architecture

> **Status**: Accepted  
> **Date**: October 2026  
> **Deciders**: Tonmoy Infrastructure Engineering Core  
> **Technical Scope**: Framework, Runtime, UI Primitives, Static Typing

---

## Context

Runstead requires an engineering framework capable of supporting both public marketing websites (demanding fast server-side rendering, SEO metadata generation, and low time-to-first-byte) and highly interactive business management panels (requiring complex forms, modals, tables, canvases, and real-time client state management).

The legacy HostPilot prototype was developed on Next.js 14 utilizing the App Router and TypeScript. As part of Phase 0, we must evaluate whether to retain this architecture or migrate to an alternative stack (such as Remix, Vite SPA + Go/Node backend, or traditional SSR).

---

## Decision

We decide to **retain and standardize on Next.js 14.2.35 with the App Router, React 18, and strict TypeScript 5.2.2**:

1. **App Router (`app/`)**: Leverages React Server Components (RSC) for public pages (`/`, `/about`, `/security`, `/pricing`, `/solutions`) to deliver zero-JS server rendering, while maintaining explicit `'use client'` boundaries for interactive business panels (`/demo/*`).
2. **Strict TypeScript**: Compiler options (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`) remain non-negotiable across all application and test code.
3. **Radix UI Primitives**: Standardize on `@radix-ui/react-*` for unstyled, accessible UI components (dialogs, dropdowns, tabs, popovers, tooltips).
4. **Tailwind CSS**: Retain utility-first styling with custom design tokens for dark surfaces and brand accents.

---

## Alternatives Considered

- **Vite SPA with Independent Node.js/Go API**:
  - *Pros*: Clear separation between frontend bundle and backend API.
  - *Cons*: Poor SEO for public marketing pages; requires maintaining two separate deployment pipelines; destroys existing working routes.
- **Remix (React Router 7)**:
  - *Pros*: Excellent web standards alignment and form mutation model.
  - *Cons*: High migration cost; would violate Non-Negotiable Rule 2.4 (Avoid Unnecessary Rewrites) without tangible business benefit.

---

## Consequences

- **Positive**:
  - Preserves 65 fully functional and tested routes.
  - Unified codebase where API route handlers (`app/api/*`) and UI components share TypeScript models and schemas.
  - Sub-90 kB shared first-load JS bundle.
- **Negative / Risks**:
  - Dependency on Next.js release cadence and framework idiosyncrasies.
  - Security advisories in Next.js 14.2.35 require monitoring and a planned upgrade in a later security phase.
