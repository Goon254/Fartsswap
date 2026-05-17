# 0006 — `Idempotency-Key` header on critical POSTs

- Status: Accepted
- Date: 2026-05-17

## Context

`POST /api/v1/reports/fake`, `POST /api/v1/reports/from-audio`, and
`POST /api/v1/reports/:id/artifacts/share-card` all create durable rows.
Mobile networks and browser retries can submit the same request twice; we
need to guarantee a single create per logical attempt without forcing
clients to invent dedupe logic.

## Decision

Adopt the (de facto industry-standard) `Idempotency-Key` request header.
Implementation:

- Postgres `idempotency_keys` table (durable, transactional with business
  data).
- Redis read-through cache (`idem:<sha256>`) for hot-retry fast-path.
- Storage key = `sha256(scope | clientKey | sessionId | optionalPathParam)`
  so retries are scoped per-session — one session cannot replay another's
  response.
- Body hash stored alongside; same key + different body → 409, never silent
  wrong-body replay.
- Replays return the cached status + body and a `Idempotent-Replayed: true`
  header so clients can tell.

## Consequences

**Wins**
- Safe retries, no duplicate reports/artifacts.
- Cross-instance safe via Redis when available; still correct with Postgres
  alone.
- Conflict detection (different body) catches client bugs early.

**Costs**
- New table + interceptor on the request path.
- TTL-based cleanup is lazy on read; long-term needs a sweep job (the
  `deleteExpired` repo method is the hook).

## Revisit when

- We move to event-sourced writes or a CQRS command bus, which naturally
  carry their own idempotency.
