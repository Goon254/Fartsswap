# Architectural Decision Records

Short, dated records of the meaningful technical choices behind this backend.
Each ADR captures the **context**, the **decision**, and the **consequences**
(both intended and known costs) so future contributors can understand *why*
something is the way it is — not just what it does.

Numbering: zero-padded, sequential. New ADRs append; existing ones are never
edited destructively — add a follow-up ADR that supersedes them.

| ID | Title | Status |
|---|---|---|
| [0001](./0001-modular-monolith.md) | Modular monolith over microservices | Accepted |
| [0002](./0002-clean-architecture-ports-and-adapters.md) | Clean architecture with ports + adapters | Accepted |
| [0003](./0003-typeorm-with-async-local-storage-transactions.md) | TypeORM + AsyncLocalStorage for transaction propagation | Accepted |
| [0004](./0004-outbox-pattern-for-analytics.md) | Outbox pattern for at-least-once analytics | Accepted |
| [0005](./0005-prometheus-otel-sentry-observability.md) | Prometheus + OpenTelemetry + Sentry observability stack | Accepted |
| [0006](./0006-idempotency-key-on-critical-posts.md) | `Idempotency-Key` header on critical POSTs | Accepted |
| [0007](./0007-anonymous-signed-cookies.md) | Anonymous signed session cookies | Accepted |
| [0008](./0008-storage-provider-fail-fast.md) | Storage provider abstraction with fail-fast bootstrap | Accepted |
