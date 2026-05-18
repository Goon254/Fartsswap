import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Report } from '../../../shared/domain/models';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { REPORT_REPOSITORY, type ReportRepository } from './ports/report.repository';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';

const PUBLIC_SLUG_RE = /^r[a-f0-9]{12}$/;

@Injectable()
export class GetReportBySlugUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async execute(slug: string, sessionId?: string): Promise<Report> {
    if (!PUBLIC_SLUG_RE.test(slug)) {
      throw new NotFoundException(`Report ${slug} not found`);
    }
    const report = await this.reports.findReportByPublicSlug(slug);
    if (!report) {
      throw new NotFoundException(`Report ${slug} not found`);
    }

    await this.trackEvent.execute({
      sessionId,
      reportId: report.id,
      eventType: AnalyticsEventType.REPORT_VIEWED,
    });

    return report;
  }
}
