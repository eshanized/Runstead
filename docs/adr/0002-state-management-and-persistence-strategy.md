# ADR-0002: State Management and Persistence Migration Strategy

> **Status**: Accepted  
> **Date**: October 2026  
> **Deciders**: Tonmoy Infrastructure Engineering Core  
> **Technical Scope**: Demo State Store, LocalStorage, Future PostgreSQL/Supabase Persistence

---

## Context

The current repository uses a client-side React Context store (`lib/demo/store.tsx`) backed by `window.localStorage` under key `runstead_demo_v3`. This architecture was designed to allow frictionless investor and partner demonstrations without requiring live database credentials, network connections, or credit cards.

However, a production operating system for hosting businesses requires persistent server-side storage, transactional ACID guarantees, referential integrity enforcement, and multi-tenant isolation. We must decide how to manage this transition without breaking existing demo journeys or expanding Phase 0 scope prematurely.

---

## Decision

We decide to:
1. **Preserve the Demo State Provider for Phase 0 and Client Demos**: Retain `lib/demo/store.tsx`, `lib/demo/seed-data.ts`, and `lib/demo/workflows.ts` for offline demonstration, unit testing, and E2E journeys.
2. **Standardize on PostgreSQL with Row-Level Security (RLS) for Production**: When real persistence is introduced (scheduled for Milestone 6 / Phase 2 in the roadmap), Runstead will adopt PostgreSQL with Prisma or Drizzle ORM.
3. **Repository Pattern Abstraction**: Design business workflows so that the mutation interface is identical whether backed by the in-memory demo store or the server-side database repository.

---

## Alternatives Considered

- **Immediate SQLite / Embedded Database in Phase 0**:
  - *Pros*: Gives immediate file persistence.
  - *Cons*: Serverless deployments (Vercel) cannot write to local disk; violates Phase 0 rule against premature database migrations.
- **Direct Client-to-Supabase Calls**:
  - *Pros*: Fast setup.
  - *Cons*: Bypasses server-side authorization; exposes database schema to public client bundles; complicates automated offline CI testing.

---

## Consequences

- **Positive**:
  - Existing 52 unit tests and 25 Playwright tests continue to run reliably offline with 0 external dependencies.
  - Clear roadmap milestone for database schema generation and migration.
- **Negative / Risks**:
  - Codebase maintains two persistence paradigms until client demo mode is superseded.
