import { SetMetadata } from '@nestjs/common';

/**
 * Per-route rate-limit overrides applied by `RateLimitInterceptor`.
 *
 * The global limiter is registered in `main.ts`. This decorator lets
 * sensitive endpoints (uploads, report creation, artifact generation) keep
 * their own tighter ceilings without changing the global budget for cheap
 * reads.
 */
export interface RateLimitConfig {
  max: number;
  windowSeconds: number;
}

export const RATE_LIMIT_METADATA = 'rate-limit-config';
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_METADATA, config);
