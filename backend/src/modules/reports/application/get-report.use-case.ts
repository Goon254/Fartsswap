import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Report } from '../../../shared/domain/models';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { REPORT_REPOSITORY, type ReportRepository } from './ports/report.repository';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';

@Injectable()
export class GetReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async execute(reportId: string, sessionId?: string): Promise<Report> {
    const report = await this.reports.findReportById(reportId);
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    await this.trackEvent.execute({
      sessionId,
      reportId,
      eventType: AnalyticsEventType.REPORT_VIEWED,
    });

    return report;
  }
}
