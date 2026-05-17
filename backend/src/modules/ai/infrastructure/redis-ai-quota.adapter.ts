import { Injectable, Logger } from '@nestjs/common';
import { RedisClient } from '../../../shared/infrastructure/redis/redis.client';
import type {
  AiQuotaPort,
  QuotaCheckRequest,
  QuotaDecision,
} from '../application/ports/ai-quota.port';

interface LocalBucket {
  count: number;
  resetAt: number;
}

/**
 * AI usage-quota adapter.
 *
 * Primary path: Redis INCR + EXPIRE keyed by
 *   `ai:quota:<scope>:<identifier>:<YYYY-MM-DD>`.
 *
 * When Redis is unavailable (e.g. local dev with QUEUE_PROVIDER=memory and
 * no Redis), the adapter falls back to a per-process in-memory map keyed by
 * `<scope>:<identifier>:<dayBucket>`. The fallback is **not** suitable for
 * multi-instance prod but keeps single-instance deployments enforcing caps
 * without a Redis dependency, and matches the rate-limit + idempotency
 * fallback pattern from Phase 5.
 *
 * Identifiers are caller-supplied opaque strings (session id, IP). The
 * adapter never logs them in cleartext: only the scope label leaves this
 * file (consumed by metrics with low cardinality).
 */
@Injectable()
export class RedisAiQuotaAdapter implements AiQuotaPort {
  private readonly logger = new Logger(RedisAiQuotaAdapter.name);
  private readonly localBuckets = new Map<string, LocalBucket>();

  constructor(private readonly redis: RedisClient) {}

  async consume(checks: QuotaCheckRequest[]): Promise<QuotaDecision[]> {
    if (checks.length === 0) return [];
    const day = currentUtcDay();
    const client = this.redis.get();
    const useRedis = !!client && client.status === 'ready';

    const decisions: QuotaDecision[] = [];
    for (const check of checks) {
      if (check.identifier.length === 0) {
        decisions.push({ ...check, count: 0, exceeded: false });
        continue;
      }
      if (useRedis && client) {
        try {
          const key = redisKey(check.scope, check.identifier, day);
          const pipeline = client.multi();
          pipeline.incr(key);
          pipeline.expireat(key, endOfUtcDayEpochSeconds(day));
          const results = await pipeline.exec();
          const raw = results?.[0]?.[1];
          const count = typeof raw === 'number' ? raw : Number(raw);
          decisions.push({
            ...check,
            count,
            exceeded: count > check.limit,
          });
          continue;
        } catch (error) {
          this.logger.warn(
            { err: error, scope: check.scope },
            'redis quota consume failed, falling back to in-process counter',
          );
        }
      }
      decisions.push(this.consumeLocal(check, day));
    }
    return decisions;
  }

  private consumeLocal(check: QuotaCheckRequest, day: string): QuotaDecision {
    const key = `${check.scope}:${check.identifier}:${day}`;
    const now = Date.now();
    let bucket = this.localBuckets.get(key);
    const expiresAt = endOfUtcDayEpochSeconds(day) * 1000;
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: expiresAt };
      this.localBuckets.set(key, bucket);
    }
    bucket.count += 1;
    return {
      ...check,
      count: bucket.count,
      exceeded: bucket.count > check.limit,
    };
  }
}

function currentUtcDay(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function redisKey(scope: string, identifier: string, day: string): string {
  return `ai:quota:${scope}:${identifier}:${day}`;
}

function endOfUtcDayEpochSeconds(day: string): number {
  // `${day}T23:59:59.999Z` -> epoch seconds, +1s padding so the key survives
  // the very last millisecond.
  const ts = Date.parse(`${day}T23:59:59.999Z`);
  return Math.floor(ts / 1000) + 1;
}
