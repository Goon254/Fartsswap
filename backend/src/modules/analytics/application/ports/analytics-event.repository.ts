import type { AnalyticsEvent } from '../../../../shared/domain/models';

export interface AnalyticsEventRepository {
  save(event: AnalyticsEvent): Promise<void>;
}

export const ANALYTICS_EVENT_REPOSITORY = Symbol('ANALYTICS_EVENT_REPOSITORY');
