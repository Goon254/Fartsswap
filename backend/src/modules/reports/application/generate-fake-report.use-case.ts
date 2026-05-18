import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Report, ReportInput } from '../../../shared/domain/models';
import { ReportSource, ReportStatus, AnalyticsEventType } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import {
  TRANSACTION_PORT,
  type TransactionPort,
} from '../../../shared/application/ports/transaction.port';
import { MetricsService } from '../../../observability/metrics.service';
import { publicSlugFromReportId } from '../../../shared/domain/public-slug';
import { AiReportOrchestrator } from '../../ai/application/ai-report.orchestrator';
import { REPORT_REPOSITORY, type ReportRepository } from './ports/report.repository';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';

export interface GenerateFakeReportCommand {
  sessionId?: string;
  customFartName?: string;
  tonePreset?: string;
  /** Best-effort client IP for AI quota accounting (not persisted, not logged). */
  ipAddress?: string;
}

@Injectable()
export class GenerateFakeReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(TRANSACTION_PORT) private readonly tx: TransactionPort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
    private readonly orchestrator: AiReportOrchestrator,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async execute(command: GenerateFakeReportCommand): Promise<Report> {
    const now = this.clock.now();
    const reportId = this.ids.generate();
    const seed = `${reportId}:${command.customFartName ?? ''}:${command.tonePreset ?? ''}`;

    // The orchestrator handles AI vs. fallback internally and NEVER throws
    // for AI-side issues — it always returns either a model-authored or a
    // deterministic-authored field set.
    const ai = await this.orchestrator.generate({
      source: ReportSource.FAKE,
      ...(command.customFartName !== undefined ? { customFartName: command.customFartName } : {}),
      ...(command.tonePreset !== undefined ? { tonePreset: command.tonePreset } : {}),
      ...(command.sessionId !== undefined ? { sessionId: command.sessionId } : {}),
      ...(command.ipAddress !== undefined ? { ipAddress: command.ipAddress } : {}),
      seed,
    });

    const report: Report = {
      id: reportId,
      sessionId: command.sessionId,
      publicSlug: publicSlugFromReportId(reportId),
      status: ReportStatus.COMPLETED,
      source: ReportSource.FAKE,
      fartName: ai.fields.fartName,
      classification: ai.fields.classification,
      powerScore: ai.fields.powerScore,
      durationMs: ai.fields.durationMs,
      emotionalTone: ai.fields.emotionalTone,
      probableCause: ai.fields.probableCause,
      cinematicParallel: ai.fields.cinematicParallel,
      threatLevel: ai.fields.threatLevel,
      fartHash: ai.fields.reportHash,
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

    // Atomic: report + report_input + outbox analytics event all commit
    // together or not at all (via TransactionPort).
    await this.tx.run(async () => {
      await this.reports.saveReport(report);
      await this.reports.saveReportInput(input);
      await this.trackEvent.trackBestEffort({
        sessionId: command.sessionId,
        reportId,
        eventType: AnalyticsEventType.REPORT_GENERATED,
        payload: {
          source: ReportSource.FAKE,
          tonePreset: command.tonePreset,
          aiSource: ai.meta.source,
          aiProvider: ai.meta.provider,
          aiModel: ai.meta.model,
          aiLatencyMs: ai.meta.latencyMs,
          aiFallbackUsed: ai.meta.fallbackUsed,
        },
      });
    });

    this.metrics?.reportsCreatedTotal.inc({ source: ReportSource.FAKE });
    return report;
  }
}
