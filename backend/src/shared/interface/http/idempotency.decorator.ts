import { SetMetadata } from '@nestjs/common';

export interface IdempotencyConfig {
  /** Logical scope so two endpoints can't collide on the same key. */
  scope: string;
  /** If set, this path param is folded into the storage key (e.g. reportId). */
  includePathParam?: string;
}

export const IDEMPOTENCY_METADATA = 'idempotency-config';
export const IDEMPOTENCY_HEADER = 'idempotency-key';
export const IDEMPOTENT_REPLAYED_HEADER = 'idempotent-replayed';

/**
 * Mark a POST endpoint as idempotent.
 *
 * When the client sends an `Idempotency-Key` header (recommended: a UUID), the
 * IdempotencyInterceptor will:
 *   1. On first request: execute the handler, persist the response (status +
 *      body), and return it normally.
 *   2. On retries with the same key + scope (+ optional path param) within
 *      the TTL: skip the handler and replay the cached response with an
 *      `Idempotent-Replayed: true` header.
 *
 * Requests without the header behave exactly as before — idempotency is
 * opt-in by the client.
 */
export const Idempotent = (config: IdempotencyConfig) =>
  SetMetadata(IDEMPOTENCY_METADATA, config);
