import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { AnalyticsEvent } from '../../../shared/domain/models';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { OUTBOX_PORT, type OutboxPort } from '../../../shared/application/ports/outbox.port';
import {
  ANALYTICS_EVENT_REPOSITORY,
  type AnalyticsEventRepository,
} from './ports/analytics-event.repository';

export interface TrackAnalyticsEventCommand {
  sessionId?: string;
  reportId?: string;
  /** Server `AnalyticsEventType` values or client catalog names (`report_view`). */
  eventType: string;
  payload?: Record<string, unknown>;
  /** When present, duplicates are rejected at persistence (client-generated UUID). */
  clientEventId?: string;
  ingestSource?: 'server' | 'client';
}

@Injectable()
export class TrackAnalyticsEventUseCase {
  private readonly logger = new Logger(TrackAnalyticsEventUseCase.name);

  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY)
    private readonly events: AnalyticsEventRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Optional() @Inject(OUTBOX_PORT) private readonly outbox?: OutboxPort,
  ) {}

  async execute(command: TrackAnalyticsEventCommand): Promise<AnalyticsEvent> {
    const event: AnalyticsEvent = {
      id: this.ids.generate(),
      ...(command.sessionId !== undefined ? { sessionId: command.sessionId } : {}),
      ...(command.reportId !== undefined ? { reportId: command.reportId } : {}),
      eventType: command.eventType,
      ...(command.payload !== undefined ? { payload: command.payload } : {}),
      createdAt: this.clock.now().toISOString(),
      ...(command.clientEventId !== undefined ? { clientEventId: command.clientEventId } : {}),
      ingestSource: command.ingestSource ?? 'server',
    };
    await this.events.save(event);
    return event;
  }

  /**
   * At-least-once analytics path.
   *
   * When the outbox is available (production path), we enqueue a row in the
   * caller's open DB transaction so the analytics event commits atomically
   * with the business write — and a background dispatcher delivers it later
   * with retries. If the transaction rolls back, the analytics event rolls
   * back with it; no ghost events.
   *
   * When no outbox is bound (unit tests), we fall back to the previous
   * fire-and-forget direct write so existing test setups keep working.
   */
  async trackBestEffort(command: TrackAnalyticsEventCommand): Promise<void> {
    if (this.outbox) {
      try {
        await this.outbox.enqueue({
          aggregateType: command.reportId ? 'report' : 'session',
          ...(command.reportId
            ? { aggregateId: command.reportId }
            : command.sessionId
              ? { aggregateId: command.sessionId }
              : {}),
          eventType: command.eventType,
          payload: {
            ...(command.payload ?? {}),
            ...(command.sessionId ? { sessionId: command.sessionId } : {}),
            ...(command.reportId ? { reportId: command.reportId } : {}),
          },
        });
        return;
      } catch (error) {
        this.logger.warn(
          { err: error, eventType: command.eventType },
          'outbox enqueue failed, falling back to direct write',
        );
      }
    }
    try {
      await this.execute(command);
    } catch (error) {
      this.logger.warn(
        { err: error, eventType: command.eventType, reportId: command.reportId },
        'analytics event failed (best-effort, ignored)',
      );
    }
  }
}
