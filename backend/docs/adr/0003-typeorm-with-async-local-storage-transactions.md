# 0003 — TypeORM + AsyncLocalStorage for transaction propagation

- Status: Accepted
- Date: 2026-05-17

## Context

Critical write flows touch multiple tables (e.g. `report` + `report_input` +
`audio_uploads` + `analytics_outbox`). Without atomicity, a crash mid-flow
leaves orphan rows and breaks invariants. We also want use cases to remain
framework-agnostic — no `EntityManager` in application code.

## Decision

Introduce a `TransactionPort` (`run<T>(work: () => Promise<T>)`) bound to a
TypeORM adapter that opens `DataSource.transaction()` and stashes the
returned `EntityManager` in an `AsyncLocalStorage`. Repositories check the
ALS on every operation; when a transaction is active they use the bound
manager, otherwise the default repository.

## Consequences

**Wins**
- Use cases stay pure: `await this.tx.run(async () => { ... })` is the only
  ORM-shaped surface they touch.
- No "pass the manager through five function parameters" antipattern.
- Outbox writes participate in the same transaction as business writes, so
  analytics is at-least-once with zero ghost events.

**Costs**
- Repositories must always go through the ALS helper; a future repository
  added without it would silently bypass transactions. Mitigated by a
  unit test that asserts manager propagation.
- `AsyncLocalStorage` carries a small overhead per request.

## Revisit when

- We adopt a different ORM, or move to per-request `EntityManager`
  injection via a NestJS request-scoped provider.
