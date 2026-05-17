import { Inject, Injectable } from '@nestjs/common';
import type { Report, ReportInput } from '../../../shared/domain/models';
import { ReportSource, ReportStatus, AnalyticsEventType } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { generateFakeReportFields } from '../domain/fake-report-generator';
import { REPORT_REPOSITORY, type ReportRepository } from './ports/report.repository';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';

export interface GenerateFakeReportCommand {
  sessionId?: string;
  customFartName?: string;
  tonePreset?: string;
}

@Injectable()
export class GenerateFakeReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async execute(command: GenerateFakeReportCommand): Promise<Report> {
    const now = this.clock.now();
    const reportId = this.ids.generate();
    const seed = `${reportId}:${command.customFartName ?? ''}:${command.tonePreset ?? ''}`;
    const generated = generateFakeReportFields({
      customFartName: command.customFartName,
      tonePreset: command.tonePreset,
      seed,
    });

    const report: Report = {
      id: reportId,
      sessionId: command.sessionId,
      status: ReportStatus.COMPLETED,
      source: ReportSource.FAKE,
      fartName: generated.fartName,
      classification: generated.classification,
      powerScore: generated.powerScore,
      durationMs: generated.durationMs,
      emotionalTone: generated.emotionalTone,
      probableCause: generated.probableCause,
      cinematicParallel: generated.cinematicParallel,
      threatLevel: generated.threatLevel,
      fartHash: generated.fartHash,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: now.toISOString(),
    };

    const input: ReportInput = {
      id: this.ids.generate(),
      reportId,
      customFartName: command.customFartName,
      tonePreset: command.tonePreset,
      source: ReportSource.FAKE,
      createdAt: now.toISOString(),
    };

    await this.reports.saveReport(report);
    await this.reports.saveReportInput(input);

    await this.trackEvent.execute({
      sessionId: command.sessionId,
      reportId,
      eventType: AnalyticsEventType.REPORT_GENERATED,
      payload: { source: ReportSource.FAKE, tonePreset: command.tonePreset },
    });

    return report;
  }
}
