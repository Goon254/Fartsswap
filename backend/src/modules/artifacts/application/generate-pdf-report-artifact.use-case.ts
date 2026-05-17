import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { ReportArtifact } from '../../../shared/domain/models';
import { AnalyticsEventType, ArtifactStatus, ArtifactType } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../../../shared/application/ports/object-storage.port';
import {
  TRANSACTION_PORT,
  type TransactionPort,
} from '../../../shared/application/ports/transaction.port';
import { MetricsService } from '../../../observability/metrics.service';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { renderReportPdf } from '../domain/pdf-report.renderer';
import { resolvePdfThemeCode } from '../domain/pdf-themes';
import {
  REPORT_ARTIFACT_REPOSITORY,
  type ReportArtifactRepository,
} from './ports/report-artifact.repository';

export interface GeneratePdfReportArtifactCommand {
  reportId: string;
  /** Required by session-ownership check. */
  sessionId: string;
  /** Free-form; unknown codes are coerced to `default`. */
  themeCode?: string;
}

/**
 * Generates a single-page PDF "diagnostic dossier" for a report.
 *
 * Deduplication: when called multiple times for the same `(reportId, themeCode)`
 * the existing READY artifact is returned without re-rendering. Combined with
 * the controller-level `@Idempotent` decorator this gives two layers of
 * idempotency — header-keyed for retries and content-keyed for repeats.
 *
 * Ownership: only the session that created the report may generate a PDF for
 * it, matching the existing share-card and audio-upload rules.
 *
 * Rendering is inline (pdfkit is fast: ~50–150ms for a single page). If we
 * ever want to defer to the worker, the queue + status fields are already
 * wired through `ArtifactStatus.PENDING/PROCESSING/READY/FAILED`.
 */
@Injectable()
export class GeneratePdfReportArtifactUseCase {
  private readonly logger = new Logger(GeneratePdfReportArtifactUseCase.name);

  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(REPORT_ARTIFACT_REPOSITORY) private readonly artifacts: ReportArtifactRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
    @Inject(TRANSACTION_PORT) private readonly tx: TransactionPort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async execute(command: GeneratePdfReportArtifactCommand): Promise<ReportArtifact> {
    const themeCode = resolvePdfThemeCode(command.themeCode);
    const startedAt = Date.now();

    await this.trackEvent.trackBestEffort({
      sessionId: command.sessionId,
      reportId: command.reportId,
      eventType: AnalyticsEventType.PDF_ARTIFACT_REQUESTED,
      payload: { themeCode, type: ArtifactType.REPORT_PDF },
    });

    const report = await this.reports.findReportById(command.reportId);
    if (!report) {
      throw new NotFoundException(`Report ${command.reportId} not found`);
    }
    if (report.sessionId && report.sessionId !== command.sessionId) {
      throw new ForbiddenException('Report does not belong to this session');
    }

    // Content-level idempotency: same report + same theme returns the
    // existing READY row (and skips re-rendering + re-storing).
    const existing = await this.artifacts.findReadyByReportTypeTheme(
      command.reportId,
      ArtifactType.REPORT_PDF,
      themeCode,
    );
    if (existing) {
      return existing;
    }

    const now = this.clock.now();
    const artifactId = this.ids.generate();
    const baseArtifact: ReportArtifact = {
      id: artifactId,
      reportId: command.reportId,
      type: ArtifactType.REPORT_PDF,
      status: ArtifactStatus.PROCESSING,
      themeCode,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // PENDING -> PROCESSING flip in one transaction so we never observe
    // PENDING without a matching PROCESSING update.
    await this.tx.run(async () => {
      await this.artifacts.save({ ...baseArtifact, status: ArtifactStatus.PENDING });
      await this.artifacts.update(baseArtifact);
    });

    try {
      const rendered = await renderReportPdf({ report, themeCode });
      const storageKey = `artifacts/report_pdf/${command.reportId}/${artifactId}.pdf`;
      await this.storage.putObject({
        key: storageKey,
        body: rendered.body,
        contentType: rendered.mimeType,
      });

      const completedAt = this.clock.now().toISOString();
      const ready: ReportArtifact = {
        ...baseArtifact,
        status: ArtifactStatus.READY,
        storageKey,
        mimeType: rendered.mimeType,
        updatedAt: completedAt,
        completedAt,
      };
      await this.artifacts.update(ready);

      const latencyMs = Date.now() - startedAt;
      this.metrics?.pdfArtifactsGeneratedTotal.inc({ themeCode, outcome: 'ok' });
      this.metrics?.pdfArtifactGenerationSeconds.observe({ themeCode }, latencyMs / 1000);
      this.metrics?.artifactsGeneratedTotal.inc({
        type: ArtifactType.REPORT_PDF,
        outcome: 'ok',
      });

      await this.trackEvent.trackBestEffort({
        sessionId: command.sessionId,
        reportId: command.reportId,
        eventType: AnalyticsEventType.PDF_ARTIFACT_GENERATED,
        payload: {
          artifactId,
          themeCode,
          sizeBytes: rendered.body.length,
          latencyMs,
        },
      });

      return ready;
    } catch (error) {
      const failedAt = this.clock.now().toISOString();
      const failureReason = error instanceof Error ? error.message : 'Unknown PDF render error';
      const failed: ReportArtifact = {
        ...baseArtifact,
        status: ArtifactStatus.FAILED,
        failureReason,
        updatedAt: failedAt,
        failedAt,
      };
      try {
        await this.artifacts.update(failed);
      } catch (persistError) {
        this.logger.warn(
          { err: persistError, artifactId },
          'failed to persist PDF artifact failure row (ignored)',
        );
      }

      this.metrics?.pdfArtifactsGeneratedTotal.inc({ themeCode, outcome: 'failed' });
      this.metrics?.artifactsGeneratedTotal.inc({
        type: ArtifactType.REPORT_PDF,
        outcome: 'failed',
      });

      await this.trackEvent.trackBestEffort({
        sessionId: command.sessionId,
        reportId: command.reportId,
        eventType: AnalyticsEventType.PDF_ARTIFACT_FAILED,
        payload: { artifactId, themeCode, reason: failureReason },
      });

      this.logger.error(
        { err: error, artifactId, themeCode, reportId: command.reportId },
        'pdf artifact generation failed',
      );

      throw new InternalServerErrorException({
        message: 'PDF artifact generation failed',
        artifactId,
        failureReason,
      });
    }
  }
}
