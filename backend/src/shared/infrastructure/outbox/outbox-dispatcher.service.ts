import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { MetricsService } from '../../../observability/metrics.service';
import { captureException } from '../../../observability/sentry';
import { TrackAnalyticsEventUseCase } from '../../../modules/analytics/application/track-analytics-event.use-case';
import type { AnalyticsEventType } from '../../domain/types';
import { TypeOrmOutboxAdapter } from './typeorm-outbox.repository';

/**
 * Background dispatcher for the analytics outbox.
 *
 * Runs only when this process has the `worker` role (APP_ROLE=worker|all).
 * Polls Postgres for pending events, calls the real analytics sink, marks
 * dispatched on success, and backs off exponentially on failure up to
 * `OUTBOX_MAX_ATTEMPTS` before parking the row as a dead-letter (left as
 * pending with attempts=max so an operator can investigate).
 */
@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private shuttingDown = false;

  constructor(
    private readonly outbox: TypeOrmOutboxAdapter,
    private readonly analytics: TrackAnalyticsEventUseCase,
    private readonly config: AppConfigService,
    private readonly metrics: MetricsService,
  ) {}

  onModuleInit(): void {
    if (!this.config.runsWorker) {
      this.logger.log('outbox dispatcher disabled (APP_ROLE != worker|all)');
      return;
    }
    this.scheduleNext(0);
  }

  async onApplicationShutdown(): Promise<void> {
    this.shuttingDown = true;
    if (this.timer) clearTimeout(this.timer);
    // Wait briefly for an in-flight tick to finish before returning.
    const deadline = Date.now() + 2000;
    while (this.running && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  private scheduleNext(delayMs: number): void {
    if (this.shuttingDown) return;
    this.timer = setTimeout(() => {
      void this.tick().finally(() => { this.scheduleNext(this.config.outbox.pollIntervalMs); });
    }, delayMs);
    // Allow process to exit cleanly when idle.
    this.timer.unref?.();
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const pendingCount = await this.outbox.countPending(now);
      this.metrics.outboxPendingGauge.set(pendingCount);

      const batch = await this.outbox.claimBatch(this.config.outbox.batchSize, now);
      if (batch.length === 0) return;

      for (const row of batch) {
        try {
          await this.analytics.execute({
            sessionId: undefined,
            ...(typeof row.aggregateId === 'string' && row.aggregateType === 'report'
              ? { reportId: row.aggregateId }
              : {}),
            eventType: row.eventType as AnalyticsEventType,
            payload: row.payload,
          });
          await this.outbox.markDispatched(row.id, new Date());
          this.metrics.outboxDispatchedTotal.inc({ outcome: 'ok' });
        } catch (error) {
          const attempts = row.attempts + 1;
          const max = this.config.outbox.maxAttempts;
          const backoffMs = Math.min(60_000, 2 ** Math.min(attempts, 16) * 200);
          const nextAt = new Date(Date.now() + backoffMs);
          const reason = error instanceof Error ? error.message : 'unknown';
          await this.outbox.markFailed(row.id, attempts, nextAt, reason);
          this.metrics.outboxDispatchedTotal.inc({
            outcome: attempts >= max ? 'dead_letter' : 'failed',
          });
          if (attempts >= max) {
            this.logger.error(
              { outboxId: row.id, eventType: row.eventType, attempts, reason },
              'outbox row hit max attempts — left as dead letter',
            );
            captureException(error, { outboxId: row.id, eventType: row.eventType });
          }
        }
      }
    } catch (error) {
      this.logger.error({ err: error }, 'outbox dispatcher tick failed');
      captureException(error);
    } finally {
      this.running = false;
    }
  }
}
