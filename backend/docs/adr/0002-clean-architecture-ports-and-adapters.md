# 0002 — Clean architecture with ports + adapters

- Status: Accepted
- Date: 2026-05-17

## Context

The product depends on several swappable infrastructure pieces: object
storage (local / S3), queue (memory / Redis), AI provider (stub / real),
clock + id generator (for deterministic tests), idempotency cache (Postgres
+ Redis). Coupling business code directly to TypeORM / AWS SDK / ioredis
would make testing slow and migrations painful.

## Decision

Every cross-cutting dependency is exposed as an application-layer **port**
(TypeScript `interface` + Symbol DI token) and consumed via constructor
injection. Infrastructure layers provide **adapters** that implement the
port. Domain code has zero framework imports.

Layers per module:
- `domain/` — pure types and business rules
- `application/` — use cases + ports
- `infrastructure/` — adapters (TypeORM, ioredis, AWS SDK, file system, …)
- `interface/http/` — controllers + DTOs

## Consequences

**Wins**
- Unit tests stub ports with plain objects — fast, no Postgres required.
- Swappable infra (e.g. local FS → S3) without touching business code.
- Architectural intent is visible in the file tree.

**Costs**
- Some boilerplate (Symbol token + interface + adapter).
- Mid-size modules accumulate many small files.

## Revisit when

- A port has only ever had one adapter for more than a year.
