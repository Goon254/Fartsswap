# 0001 — Modular monolith over microservices

- Status: Accepted
- Date: 2026-05-17

## Context

The product is a no-login web app generating share-card artifacts from short
audio clips. Early launch traffic is unknown, the team is small, and the
domain model (reports, artifacts, audio, identity, analytics) is tightly
coupled by sessions and transactional consistency.

## Decision

Ship a single deployable NestJS application organised as a modular monolith,
with explicit bounded contexts per module (`reports`, `artifacts`, `audio`,
`identity`, `analytics`, `ai`, `commerce`, `admin`). Each module owns its
domain/application/infrastructure/interface layers; cross-module
communication goes through application services, never via repositories.

Background work runs in the same image under a different entrypoint
(`dist/worker.js`) so it can be scheduled as a separate pod when traffic
warrants.

## Consequences

**Wins**
- Single codebase, single CI, single deploy — drastically lower operational
  cost during validation.
- Transactional writes that span modules (e.g. report + audio link) stay
  cheap and consistent.
- Refactoring stays local; no IPC contracts to evolve.

**Costs**
- Teams must enforce module boundaries by convention (linting + reviews).
- Scaling individual concerns requires the worker/api split (already
  implemented) before any further decomposition.

## Revisit when

- A single bounded context shows materially different scaling characteristics
  (e.g. AI analysis CPU-bound + latency-tolerant).
- Multiple teams need to ship independently.
