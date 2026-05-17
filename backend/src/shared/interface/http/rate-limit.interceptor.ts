import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, type Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';
import { RedisClient } from '../../infrastructure/redis/redis.client';
import { RATE_LIMIT_METADATA, type RateLimitConfig } from './rate-limit.decorator';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Per-route token bucket on top of the global Fastify rate limiter.
 *
 * Backing store:
 *  - Redis (atomic INCR + EXPIRE) when available — safe across replicas.
 *  - In-process Map fallback for single-instance / dev / when Redis is down.
 *
 * Bucket key uses the controller + handler name (stable across path params)
 * plus the client IP, so /reports/<uuid> shares a bucket per IP.
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);
  private readonly localBuckets = new Map<string, Bucket>();

  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisClient,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const config = this.reflector.get<RateLimitConfig>(RATE_LIMIT_METADATA, handler);
    if (!config) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const ip = this.clientKey(request);
    const routeKey = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `rl:${routeKey}:${ip}`;
    const windowMs = config.windowSeconds * 1000;

    return from(this.consume(key, config.max, windowMs)).pipe(
      switchMap((decision) => {
        if (!decision.allowed) {
          this.logger.warn(
            { route: routeKey, ip, max: config.max, windowSeconds: config.windowSeconds },
            'route rate limit exceeded',
          );
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              error: 'Too Many Requests',
              message: `Rate limit exceeded for this endpoint. Retry after ${decision.retryAfter}s.`,
              retryAfter: decision.retryAfter,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        return next.handle();
      }),
    );
  }

  private async consume(
    key: string,
    max: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; retryAfter: number }> {
    const redis = this.redis.get();
    if (redis?.status === 'ready') {
      try {
        const pipeline = redis.multi();
        pipeline.incr(key);
        pipeline.pttl(key);
        const results = await pipeline.exec();
        const countRaw = results?.[0]?.[1];
        const pttlRaw = results?.[1]?.[1];
        const count = typeof countRaw === 'number' ? countRaw : Number(countRaw);
        const pttl = typeof pttlRaw === 'number' ? pttlRaw : Number(pttlRaw);
        if (count === 1 || pttl < 0) {
          await redis.pexpire(key, windowMs);
        }
        if (count > max) {
          const retryAfter = Math.max(1, Math.ceil((pttl > 0 ? pttl : windowMs) / 1000));
          return { allowed: false, retryAfter };
        }
        return { allowed: true, retryAfter: 0 };
      } catch (error) {
        this.logger.warn({ err: error }, 'redis rate limit failed, falling back to local');
      }
    }
    return this.consumeLocal(key, max, windowMs);
  }

  private consumeLocal(
    key: string,
    max: number,
    windowMs: number,
  ): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    let bucket = this.localBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.localBuckets.set(key, bucket);
    }
    if (bucket.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return { allowed: false, retryAfter };
    }
    bucket.count += 1;
    return { allowed: true, retryAfter: 0 };
  }

  private clientKey(request: FastifyRequest): string {
    const fwd = request.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length > 0) {
      const first = fwd.split(',')[0];
      if (first) return first.trim();
    }
    return request.ip ?? 'unknown';
  }
}
