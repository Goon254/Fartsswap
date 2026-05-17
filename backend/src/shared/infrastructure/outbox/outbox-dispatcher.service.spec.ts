import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { MetricsService } from '../../../observability/metrics.service';
import type { AppConfigService } from '../../../config/config.service';
import type { TrackAnalyticsEventUseCase } from '../../../modules/analytics/application/track-analytics-event.use-case';
import type { TypeOrmOutboxAdapter } from './typeorm-outbox.repository';
import type { AnalyticsOutboxEntity } from '../persistence/outbox.entity';

function makeMetrics(): MetricsService {
  const m = new MetricsService();
  m.onModuleInit();
  return m;
}

function makeOutbox(): jest.Mocked<TypeOrmOutboxAdapter> {
  return {
    countPending: jest.fn().mockResolvedValue(0),
    claimBatch: jest.fn().mockResolvedValue([]),
    markDispatched: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    enqueue: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmOutboxAdapter>;
}

function makeAnalytics(): jest.Mocked<Pick<TrackAnalyticsEventUseCase, 'execute'>> {
  return { execute: jest.fn().mockResolvedValue({}) };
}

function makeConfig(overrides?: Partial<{ batchSize: number; pollIntervalMs: number; maxAttempts: number }>): AppConfigService {
  return {
    runsWorker: true,
    outbox: {
      batchSize: overrides?.batchSize ?? 10,
      pollIntervalMs: overrides?.pollIntervalMs ?? 1000,
      maxAttempts: overrides?.maxAttempts ?? 3,
    },
  } as unknown as AppConfigService;
}

function row(id: string, eventType: string): AnalyticsOutboxEntity {
  return {
    id,
    aggregateType: 'report',
    aggregateId: 'rep-1',
    eventType,
    payload: {},
    attempts: 0,
    nextAttemptAt: new Date(),
    createdAt: new Date(),
  };
}

describe('OutboxDispatcherService', () => {
  it('marks a row dispatched on successful analytics write', async () => {
    const outbox = makeOutbox();
    const analytics = makeAnalytics();
    const metrics = makeMetrics();
    outbox.claimBatch.mockResolvedValueOnce([row('o-1', 'report.generated')]);

    const svc = new OutboxDispatcherService(
      outbox,
      analytics as unknown as TrackAnalyticsEventUseCase,
      makeConfig(),
      metrics,
    );

    // call tick directly (no timer)
    await (svc as unknown as { tick: () => Promise<void> }).tick();

    expect(analytics.execute).toHaveBeenCalled();
    expect(outbox.markDispatched).toHaveBeenCalledWith('o-1', expect.any(Date));
  });

  it('retries with exponential backoff on failure and parks as dead-letter past max attempts', async () => {
    const outbox = makeOutbox();
    const analytics = makeAnalytics();
    const metrics = makeMetrics();
    const failing = row('o-2', 'report.generated');
    failing.attempts = 2; // next failure -> attempts=3 = maxAttempts
    outbox.claimBatch.mockResolvedValueOnce([failing]);
    analytics.execute.mockRejectedValueOnce(new Error('boom'));

    const svc = new OutboxDispatcherService(
      outbox,
      analytics as unknown as TrackAnalyticsEventUseCase,
      makeConfig({ maxAttempts: 3 }),
      metrics,
    );

    await (svc as unknown as { tick: () => Promise<void> }).tick();

    expect(outbox.markFailed).toHaveBeenCalledWith(
      'o-2',
      3,
      expect.any(Date),
      'boom',
    );
    expect(outbox.markDispatched).not.toHaveBeenCalled();
  });

  it('does nothing when the batch is empty', async () => {
    const outbox = makeOutbox();
    const analytics = makeAnalytics();
    const metrics = makeMetrics();

    const svc = new OutboxDispatcherService(
      outbox,
      analytics as unknown as TrackAnalyticsEventUseCase,
      makeConfig(),
      metrics,
    );
    await (svc as unknown as { tick: () => Promise<void> }).tick();

    expect(analytics.execute).not.toHaveBeenCalled();
    expect(outbox.markDispatched).not.toHaveBeenCalled();
  });
});
