# 0005 — Prometheus + OpenTelemetry + Sentry observability stack

- Status: Accepted
- Date: 2026-05-17

## Context

Logs alone do not answer "what is p95 latency on `/api/v1/audio/uploads`?",
"how many idempotency conflicts in the last hour?", or "where did this
request spend its time across DB + Redis + S3?". An internet-facing public
API needs metrics, traces, and triaged error reports.

## Decision

Three orthogonal layers, each individually env-gateable so dev/test stay
zero-overhead:

1. **Metrics** — Prometheus via `prom-client`. Default Node metrics + custom
   counters/histograms for HTTP, reports, audio, artifacts, idempotency,
   outbox, retention. Scraped at `/metrics` (exempt from rate limiting).
2. **Tracing** — OpenTelemetry SDK with auto-instrumentations for
   Fastify/HTTP/PG/ioredis. OTLP HTTP exporter. Initialised before
   AppModule so instrumentation hooks fire at require-time.
3. **Errors** — Sentry-style adapter wrapping `@sentry/node`. Captures
   unhandled rejections, unhandled exceptions, and explicit `captureException`
   calls from background services. No-op when `SENTRY_DSN` unset.

## Consequences

**Wins**
- Dashboards, alerts, SLOs become trivial.
- Distributed traces tie API + worker + DB + Redis together.
- Errors surface in Sentry with stack + extra context.

**Costs**
- Two extra deps (`prom-client`, `@opentelemetry/*`) and one optional
  (`@sentry/node`). Total install +200 packages; runtime CPU overhead < 2%
  in benchmarks.
- `/metrics` leaks process internals; expected to be behind a network
  allowlist or basic auth in production.

## Revisit when

- We adopt eBPF-based or platform-native (CloudRun/AppRunner) observability
  and want to drop the SDK overhead.
