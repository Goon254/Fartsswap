import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { from, type Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../config/config.service';
import { MetricsService } from '../../../observability/metrics.service';
import { RedisClient } from '../../infrastructure/redis/redis.client';
import {
  type IdempotencyRecord,
  IdempotencyRepository,
} from '../../infrastructure/persistence/idempotency.repository';
import {
  IDEMPOTENCY_HEADER,
  IDEMPOTENCY_METADATA,
  IDEMPOTENT_REPLAYED_HEADER,
  type IdempotencyConfig,
} from './idempotency.decorator';

const KEY_FORMAT = /^[A-Za-z0-9_.:-]{8,128}$/;

/**
 * Server-side idempotency for POST endpoints decorated with `@Idempotent`.
 *
 * Storage strategy (read-through):
 *   1. Redis cache lookup (`idem:<sha>`) — fast path for hot retries.
 *   2. Postgres `idempotency_keys` — durable cross-instance store.
 *
 * Writes go to Postgres synchronously (so a crash between cache + DB still
 * gives correct replay) and then warm the Redis cache best-effort.
 *
 * Storage key = sha256(scope|clientKey|sessionId|optionalPathParam), scoping
 * retries to the originating session. A different body with the same key
 * returns 409 instead of silently replaying.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly repo: IdempotencyRepository,
    private readonly config: AppConfigService,
    private readonly metrics: MetricsService,
    private readonly redis: RedisClient,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const cfg = this.reflector.get<IdempotencyConfig>(IDEMPOTENCY_METADATA, handler);
    if (!cfg) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    const headerValue = this.headerValue(request, IDEMPOTENCY_HEADER);
    if (!headerValue) {
      return next.handle();
    }

    if (!KEY_FORMAT.test(headerValue)) {
      throw new ConflictException(
        'Invalid Idempotency-Key (8-128 chars; alphanumerics, _ . : -).',
      );
    }

    const sessionId = this.extractSessionId(request);
    const pathParam = cfg.includePathParam
      ? (request.params as Record<string, string> | undefined)?.[cfg.includePathParam]
      : undefined;
    const storageKey = this.computeStorageKey(cfg.scope, headerValue, sessionId, pathParam);
    const requestHash = this.computeRequestHash(request);
    const now = new Date();

    return from(this.lookup(storageKey, now)).pipe(
      switchMap((existing) => {
        if (existing) {
          if (existing.requestHash !== requestHash) {
            this.metrics.idempotencyReplayTotal.inc({ scope: cfg.scope, outcome: 'conflict' });
            throw new ConflictException(
              'Idempotency-Key was previously used with a different request payload.',
            );
          }
          this.metrics.idempotencyReplayTotal.inc({ scope: cfg.scope, outcome: 'hit' });
          void reply.header(IDEMPOTENT_REPLAYED_HEADER, 'true');
          void reply.status(existing.responseStatus);
          return of(existing.responseBody);
        }

        this.metrics.idempotencyReplayTotal.inc({ scope: cfg.scope, outcome: 'miss' });
        return next.handle().pipe(
          tap((body) => {
            const status = reply.statusCode || 200;
            const ttlMs = this.config.idempotencyTtlSeconds * 1000;
            const record: IdempotencyRecord = {
              storageKey,
              scope: cfg.scope,
              clientKey: headerValue,
              ...(sessionId ? { sessionId } : {}),
              requestHash,
              responseStatus: status,
              responseBody: body ?? null,
              createdAt: now,
              expiresAt: new Date(now.getTime() + ttlMs),
            };
            void this.persist(record).catch((error: unknown) => {
              this.logger.warn(
                { err: error, scope: cfg.scope },
                'failed to persist idempotency record (ignored)',
              );
            });
          }),
        );
      }),
    );
  }

  private async lookup(storageKey: string, now: Date): Promise<IdempotencyRecord | null> {
    const cached = await this.readFromCache(storageKey);
    if (cached) return cached;
    const row = await this.repo.findActive(storageKey, now);
    if (row) {
      void this.writeToCache(row).catch(() => undefined);
    }
    return row;
  }

  private async persist(record: IdempotencyRecord): Promise<void> {
    await this.repo.insert(record);
    await this.writeToCache(record);
  }

  private async readFromCache(storageKey: string): Promise<IdempotencyRecord | null> {
    const client = this.redis.get();
    if (client?.status !== 'ready') return null;
    try {
      const raw = await client.get(`idem:${storageKey}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Omit<IdempotencyRecord, 'createdAt' | 'expiresAt'> & {
        createdAt: string;
        expiresAt: string;
      };
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        expiresAt: new Date(parsed.expiresAt),
      };
    } catch (error) {
      this.logger.warn({ err: error }, 'idempotency cache read failed');
      return null;
    }
  }

  private async writeToCache(record: IdempotencyRecord): Promise<void> {
    const client = this.redis.get();
    if (client?.status !== 'ready') return;
    const ttlSeconds = Math.max(
      1,
      Math.floor((record.expiresAt.getTime() - Date.now()) / 1000),
    );
    await client.set(
      `idem:${record.storageKey}`,
      JSON.stringify({
        ...record,
        createdAt: record.createdAt.toISOString(),
        expiresAt: record.expiresAt.toISOString(),
      }),
      'EX',
      ttlSeconds,
    );
  }

  private headerValue(request: FastifyRequest, name: string): string | undefined {
    const value = request.headers[name];
    if (Array.isArray(value)) return value[0];
    return typeof value === 'string' ? value.trim() : undefined;
  }

  private extractSessionId(request: FastifyRequest): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    const raw = cookies?.[this.config.session.cookieName];
    if (!raw) return undefined;
    return raw.split('.')[0];
  }

  private computeStorageKey(
    scope: string,
    clientKey: string,
    sessionId: string | undefined,
    pathParam: string | undefined,
  ): string {
    return createHash('sha256')
      .update([scope, clientKey, sessionId ?? '', pathParam ?? ''].join('|'))
      .digest('hex');
  }

  private computeRequestHash(request: FastifyRequest): string {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const params = request.params ?? {};
    const query = request.query ?? {};
    const payload = JSON.stringify({ body, params, query }, Object.keys(body).sort());
    return createHash('sha256').update(payload).digest('hex');
  }
}
