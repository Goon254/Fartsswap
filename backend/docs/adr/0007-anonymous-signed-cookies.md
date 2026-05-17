# 0007 — Anonymous signed session cookies

- Status: Accepted
- Date: 2026-05-17

## Context

The product is intentionally no-login. The only identity is an anonymous
session cookie that scopes a user's reports, artifacts, and audio. Without
a signature, a curl request with a guessed UUID can read another user's
data — a hard-to-spot privacy bug.

## Decision

Sign the session cookie with HMAC-SHA-256 via `@fastify/cookie`'s built-in
signing (`signed: true`). Secret comes from `SESSION_COOKIE_SECRET`,
**required in production** (Zod schema rejects boot if unset, dev has a
clearly labelled fallback). Cookie attributes are `httpOnly`,
`SameSite=Lax`, `Secure` in production, TTL from `SESSION_TTL_SECONDS`.
Reads route through `readSignedSessionCookie` which treats an invalid
signature as "no cookie" and mints a new session.

## Consequences

**Wins**
- Cookie tampering is detected; no impersonation by guessed session ID.
- Existing client contract (cookie name + value) is preserved; only the
  on-wire format changes (`<id>.<sig>`).
- One-line secret rotation by updating env (the library supports an array
  of secrets if/when overlap is needed).

**Costs**
- A wrong-secret deploy invalidates every existing cookie. Mitigated by
  multi-secret support when we adopt rotation.

## Revisit when

- We add real auth, at which point this becomes a fallback identity for
  anonymous flows rather than the only identity.
