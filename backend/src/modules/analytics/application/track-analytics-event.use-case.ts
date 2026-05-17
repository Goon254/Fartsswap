import { Inject, Injectable } from '@nestjs/common';
import type { AnalyticsEvent } from '../../../shared/domain/models';
import type { AnalyticsEventType } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import {
  ANALYTICS_EVENT_REPOSITORY,
  type AnalyticsEventRepository,
} from './ports/analytics-event.repository';

export interface TrackAnalyticsEventCommand {
  sessionId?: string;
  reportId?: string;
  eventType: AnalyticsEventType;
  payload?: Record<string, unknown>;
}

@Injectable()
export class TrackAnalyticsEventUseCase {
  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY)
    private readonly events: AnalyticsEventRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: TrackAnalyticsEventCommand): Promise<AnalyticsEvent> {
    const event: AnalyticsEvent = {
      id: this.ids.generate(),
      sessionId: command.sessionId,
      reportId: command.reportId,
      eventType: command.eventType,
      payload: command.payload,
      createdAt: this.clock.now().toISOString(),
    };
    await this.events.save(event);
    return event;
  }
}
