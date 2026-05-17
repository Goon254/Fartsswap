# 0004 — Outbox pattern for at-least-once analytics

- Status: Accepted
- Date: 2026-05-17

## Context

Analytics events used to be written directly inside use cases. Failures were
"best effort" (swallowed + logged), which silently dropped events whenever
the analytics store hiccuped. Mixing analytics writes into the business
transaction was equally bad: a logging failure could roll back a report.

## Decision

Persist analytics events into an `analytics_outbox` table inside the same
transaction as the business write. A separate `OutboxDispatcherService`
running in the worker process polls pending rows, calls the real analytics
sink, marks dispatched on success, and applies exponential backoff up to
`OUTBOX_MAX_ATTEMPTS` (then leaves the row as a dead-letter for operator
inspection).

## Consequences

**Wins**
- At-least-once delivery without coupling request latency to analytics
  health.
- Atomic with business state: an analytics row exists if and only if its
  business row exists.
- Dispatcher metrics (`outbox_pending_events`, `outbox_dispatched_total`)
  give clear operational visibility.

**Costs**
- Extra table + background poller. Polling adds load proportional to
  pending volume.
- The dispatcher must be deployed (APP_ROLE includes worker) or events
  back up. Documented + measured via the gauge.

## Revisit when

- We outgrow Postgres for analytics ingest, or we want sub-second delivery
  (would replace polling with `LISTEN`/`NOTIFY` or stream to Kafka).
