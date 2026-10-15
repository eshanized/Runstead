# ADR-0005: 32-Phase Roadmap Structure & Execution Governance

> **Status**: Proposed (Awaiting Canonical Stakeholder Approval)  
> **Date**: October 2026  
> **Deciders**: Tonmoy Infrastructure Engineering Core  
> **Technical Scope**: Project Delivery Phasing, Milestones, GitHub Issue Alignment

---

## Context

The repository contains an established **6-Milestone, 42-Task Roadmap** documented in [`docs/ROADMAP.md`](file:///docs/ROADMAP.md), [`docs/GITHUB_INTEGRATION.md`](file:///docs/GITHUB_INTEGRATION.md), [`scripts/setup-github-roadmap.sh`](file:///scripts/setup-github-roadmap.sh), and [`lib/github/snapshot.ts`](file:///lib/github/snapshot.ts). This structure is directly connected to the live `/progress` page.

The project directive for Phase 0 requires organizing Runstead into **32 phases, numbered Phase 0 through Phase 31**. An exhaustive inspection of the Git history, tags, commit bodies, and files confirmed that a granular 32-phase document was not previously committed into this repository.

To reconcile the established 6-Milestone delivery model with the 32-Phase directive without silently inventing requirements or fabricating historical agreements, an architectural decision on roadmap structuring is required.

---

## Decision

We propose to:
1. **Adopt a 32-Phase Delivery Roadmap ([`docs/ROADMAP_32_PHASES.md`](file:///docs/ROADMAP_32_PHASES.md)) as a Proposed Structural Expansion**: Map the 6 milestones and 3 strategic horizons into 32 logical, sequential, dependency-checked phases (Phase 0 through Phase 31).
2. **Explicitly Flag Phases 1–31 as `PROPOSED — NOT APPROVED`**: In accordance with Phase 0 Non-Negotiable Rule 2.2, no unverified phase is represented as a previously agreed baseline until Tonmoy Infrastructure stakeholders review and formally approve it.
3. **Preserve the Existing 6-Milestone GitHub Mapping**: The public progress engine (`/progress`) and GitHub issue tracker continue tracking the 42 concrete deliverables, which map cleanly as child tasks under the 32 phases.
4. **Enforce Phase Gating**: Every phase from 0 to 31 must satisfy strict Definition of Done exit criteria before proceeding to the subsequent phase.

---

## Alternatives Considered

- **Decline 32-Phase Phasing and Retain Only 6 Milestones**:
  - *Pros*: Matches existing committed docs without structural expansion.
  - *Cons*: Violates explicit project management directive for Phase 0.
- **Fabricate a 32-Phase Roadmap Claiming Prior Agreement**:
  - *Pros*: Superficial appearance of pre-existing consensus.
  - *Cons*: Strictly prohibited by Non-Negotiable Rules 2.2 and 2.6 (No Fabricated Progress / Evidence Before Claims).

---

## Consequences

- **Positive**:
  - Provides a granular engineering path across all 32 phases with explicit dependency trees.
  - Maintains 100% honesty regarding historical evidence and repository records.
  - Backwards-compatible with GitHub milestone scripts and progress telemetry.
- **Negative / Risks**:
  - Requires stakeholder sign-off on the proposed phase assignments before Phase 1 begins.
