import type { ExecutionContext } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IDEMPOTENCY_METADATA, IDEMPOTENT_REPLAYED_HEADER } from './idempotency.decorator';
import type { IdempotencyRepository } from '../../infrastructure/persistence/idempotency.repository';
import type { AppConfigService } from '../../../config/config.service';
import { MetricsService } from '../../../observability/metrics.service';
import type { RedisClient } from '../../infrastructure/redis/redis.client';

function makeContext(opts: {
  metadata?: { scope: string; includePathParam?: string };
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  query?: unknown;
}) {
  const reply = {
    statusCode: 201,
    header: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  const request = {
    headers: opts.headers ?? {},
    cookies: opts.cookies ?? {},
    body: opts.body ?? {},
    params: opts.params ?? {},
    query: opts.query ?? {},
  };
  const ctx = {
    getHandler: () => () => undefined,
    getClass: () => class C {},
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
  } as unknown as ExecutionContext;

  const reflector = {
    get: jest.fn((key: string) => (key === IDEMPOTENCY_METADATA ? opts.metadata : undefined)),
  } as unknown as Reflector;

  return { ctx, reflector, reply, request };
}

function makeRepo(): jest.Mocked<IdempotencyRepository> {
  return {
    findActive: jest.fn(),
    insert: jest.fn().mockResolvedValue(undefined),
    deleteExpired: jest.fn(),
  } as unknown as jest.Mocked<IdempotencyRepository>;
}

function makeMetrics(): MetricsService {
  const metrics = new MetricsService();
  metrics.onModuleInit();
  return metrics;
}

const noRedis = { get: () => undefined } as unknown as RedisClient;

const config = {
  idempotencyTtlSeconds: 60,
  session: { cookieName: 'farts_session' },
} as unknown as AppConfigService;

function buildInterceptor(
  reflector: Reflector,
  repo: jest.Mocked<IdempotencyRepository>,
): IdempotencyInterceptor {
  return new IdempotencyInterceptor(reflector, repo, config, makeMetrics(), noRedis);
}

describe('IdempotencyInterceptor', () => {
  it('skips the cache when no Idempotency-Key header is sent', async () => {
    const { ctx, reflector } = makeContext({ metadata: { scope: 'reports:fake' } });
    const repo = makeRepo();
    const interceptor = buildInterceptor(reflector, repo);

    const result = await lastValueFrom(
      interceptor.intercept(ctx, { handle: () => of({ ok: true }) }),
    );

    expect(result).toEqual({ ok: true });
    expect(repo.findActive).not.toHaveBeenCalled();
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('caches a fresh response and replays on retry', async () => {
    const repo = makeRepo();
    const reflector = { get: () => ({ scope: 'reports:fake' }) } as unknown as Reflector;
    const interceptor = buildInterceptor(reflector, repo);

    repo.findActive.mockResolvedValueOnce(null);
    const { ctx: ctx1 } = makeContext({
      metadata: { scope: 'reports:fake' },
      headers: { 'idempotency-key': 'abc123abc123' },
      body: { customFartName: 'Bean' },
    });
    const first = await lastValueFrom(
      interceptor.intercept(ctx1, { handle: () => of({ id: 'r1' }) }),
    );
    expect(first).toEqual({ id: 'r1' });
    await new Promise((r) => setImmediate(r));
    expect(repo.insert).toHaveBeenCalledTimes(1);

    const firstCall = repo.insert.mock.calls[0];
    if (!firstCall) throw new Error('expected insert to be called');
    const cached = firstCall[0];
    repo.findActive.mockResolvedValueOnce(cached);

    const { ctx: ctx2, reply: reply2 } = makeContext({
      metadata: { scope: 'reports:fake' },
      headers: { 'idempotency-key': 'abc123abc123' },
      body: { customFartName: 'Bean' },
    });
    const replayed = await lastValueFrom(
      interceptor.intercept(ctx2, { handle: () => of({ id: 'SHOULD-NOT-RUN' }) }),
    );
    expect(replayed).toEqual({ id: 'r1' });
    expect(reply2.header).toHaveBeenCalledWith(IDEMPOTENT_REPLAYED_HEADER, 'true');
  });

  it('throws ConflictException when same key is reused with a different body', async () => {
    const repo = makeRepo();
    const reflector = { get: () => ({ scope: 'reports:fake' }) } as unknown as Reflector;
    const interceptor = buildInterceptor(reflector, repo);

    repo.findActive.mockResolvedValueOnce({
      storageKey: 'x',
      scope: 'reports:fake',
      clientKey: 'abc123abc123',
      requestHash: 'different-hash-than-incoming',
      responseStatus: 201,
      responseBody: { id: 'r1' },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    const { ctx } = makeContext({
      metadata: { scope: 'reports:fake' },
      headers: { 'idempotency-key': 'abc123abc123' },
      body: { customFartName: 'New Body' },
    });

    await expect(
      lastValueFrom(interceptor.intercept(ctx, { handle: () => of({ id: 'r1' }) })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects malformed Idempotency-Key values', async () => {
    const repo = makeRepo();
    const reflector = { get: () => ({ scope: 'reports:fake' }) } as unknown as Reflector;
    const interceptor = buildInterceptor(reflector, repo);

    const { ctx } = makeContext({
      metadata: { scope: 'reports:fake' },
      headers: { 'idempotency-key': 'short' },
    });

    expect(() => interceptor.intercept(ctx, { handle: () => of({}) })).toThrow(ConflictException);
  });
});
