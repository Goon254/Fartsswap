import type { FastifyRequest } from 'fastify';

/**
 * Resolve the best-available client IP for quota / rate-limit purposes.
 *
 * Trusts only the first hop of `X-Forwarded-For` (set when running behind
 * a reverse proxy / CDN). Falls back to Fastify's resolved `request.ip`,
 * then `'unknown'` as the very last resort.
 *
 * Returned value is the bare IP string. Callers must NEVER place it in
 * metric labels (high cardinality, PII). It's safe in:
 *   - Redis-key contents (never logged)
 *   - request-scoped logs at DEBUG only
 *   - opaque identifier inputs to the quota adapter
 */
export function resolveClientIp(request: FastifyRequest): string {
  const fwd = request.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    const first = fwd.split(',')[0];
    if (first) {
      const trimmed = first.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return request.ip || 'unknown';
}
