import type { ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { MetricsService } from './metrics.service';

function makeCtx(opts: { url?: string; status?: number; className?: string; handlerName?: string }) {
  const reply = { statusCode: opts.status ?? 200 };
  const request = { method: 'GET', url: opts.url ?? '/x' };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
    getClass: () => ({ name: opts.className ?? 'TestCtl' }),
    getHandler: () => ({ name: opts.handlerName ?? 'op' }),
  } as unknown as ExecutionContext;
}

describe('HttpMetricsInterceptor', () => {
  let metrics: MetricsService;
  let interceptor: HttpMetricsInterceptor;

  beforeEach(() => {
    metrics = new MetricsService();
    metrics.onModuleInit();
    interceptor = new HttpMetricsInterceptor(metrics);
  });

  it('records a successful response', async () => {
    const ctx = makeCtx({ status: 201, handlerName: 'create' });
    const result = await lastValueFrom(
      interceptor.intercept(ctx, { handle: () => of({ ok: true }) }),
    );
    expect(result).toEqual({ ok: true });
    const out = await metrics.snapshot();
    expect(out).toContain('TestCtl.create');
    expect(out).toContain('status_code="201"');
  });

  it('records the status_code on error too', async () => {
    const ctx = makeCtx({ status: 500, handlerName: 'fail' });
    await expect(
      lastValueFrom(interceptor.intercept(ctx, { handle: () => throwError(() => new Error('boom')) })),
    ).rejects.toThrow('boom');
    const out = await metrics.snapshot();
    expect(out).toContain('TestCtl.fail');
    expect(out).toContain('status_code="500"');
  });

  it('skips its own scrape endpoint', async () => {
    const ctx = makeCtx({ url: '/metrics', handlerName: 'scrape' });
    await lastValueFrom(interceptor.intercept(ctx, { handle: () => of('') }));
    const out = await metrics.snapshot();
    expect(out).not.toContain('Test.scrape');
  });
});
