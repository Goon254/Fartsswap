import { ForbiddenException, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import type { Report, ReportInput } from '../../../shared/domain/models';
import {
  AnalyticsEventType,
  AudioStatus,
  ReportSource,
  ReportStatus,
} from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../../../shared/application/ports/object-storage.port';
import { QUEUE_PORT, type QueuePort } from '../../../shared/application/ports/queue.port';
import {
  TRANSACTION_PORT,
  type TransactionPort,
} from '../../../shared/application/ports/transaction.port';
import { AppConfigService } from '../../../config/config.service';
import { MetricsService } from '../../../observability/metrics.service';
import { AiReportOrchestrator } from '../../ai/application/ai-report.orchestrator';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from '../../audio/application/ports/audio-upload.repository';
import { AUDIO_PROCESSING_QUEUE } from '../../audio/application/upload-audio.use-case';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { REPORT_REPOSITORY, type ReportRepository } from './ports/report.repository';

export interface CreateReportFromAudioCommand {
  audioUploadId: string;
  sessionId?: string;
  customFartName?: string;
  tonePreset?: string;
  /** Best-effort client IP for AI quota accounting (not persisted, not logged). */
  ipAddress?: string;
}

/**
 * Creates a report from an uploaded audio clip.
 *
 * Field content comes from `AiReportOrchestrator`, which uses the configured
 * AI provider when available and falls back to the deterministic generator
 * for any AI failure. The HTTP/DB contract is unchanged from earlier phases.
 */
@Injectable()
export class CreateReportFromAudioUseCase {
  private readonly logger = new Logger(CreateReportFromAudioUseCase.name);

  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly audioUploads: AudioUploadRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort,
    @Inject(TRANSACTION_PORT) private readonly tx: TransactionPort,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
    private readonly config: AppConfigService,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
    private readonly orchestrator: AiReportOrchestrator,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async execute(command: CreateReportFromAudioCommand): Promise<Report> {
    const upload = await this.audioUploads.findById(command.audioUploadId);
    if (!upload || upload.status === AudioStatus.DELETED) {
      throw new NotFoundException(`Audio upload ${command.audioUploadId} not found`);
    }

    if (command.sessionId && upload.sessionId && upload.sessionId !== command.sessionId) {
      throw new ForbiddenException('Audio upload does not belong to this session');
    }

    if (upload.status !== AudioStatus.UPLOADED) {
      throw new ForbiddenException(`Audio upload is not available (status: ${upload.status})`);
    }

    if (upload.reportId) {
      throw new ForbiddenException('Audio upload is already linked to a report');
    }

    const now = this.clock.now();
    const reportId = this.ids.generate();

    const seed = `${reportId}:audio:${command.audioUploadId}:${command.customFartName ?? ''}`;
    const ai = await this.orchestrator.generate({
      source: ReportSource.AUDIO_RECORDING,
      ...(command.customFartName !== undefined ? { customFartName: command.customFartName } : {}),
      ...(command.tonePreset !== undefined ? { tonePreset: command.tonePreset } : {}),
      ...(upload.durationSeconds !== undefined ? { durationSeconds: upload.durationSeconds } : {}),
      ...(command.sessionId !== undefined
        ? { sessionId: command.sessionId }
        : upload.sessionId !== undefined
          ? { sessionId: upload.sessionId }
          : {}),
      ...(command.ipAddress !== undefined ? { ipAddress: command.ipAddress } : {}),
      audioMetadata: {
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
      },
      seed,
    });

    const report: Report = {
      id: reportId,
      sessionId: command.sessionId ?? upload.sessionId,
      status: ReportStatus.COMPLETED,
      source: ReportSource.AUDIO_RECORDING,
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
      audioUploadId: command.audioUploadId,
      customFartName: command.customFartName,
      tonePreset: command.tonePreset,
      durationMs: ai.fields.durationMs,
      source: ReportSource.AUDIO_RECORDING,
      createdAt: now.toISOString(),
    };

    const processedAt = now.toISOString();
    const linkedUpload = {
      ...upload,
      reportId,
      status: AudioStatus.PROCESSED,
      updatedAt: processedAt,
      processedAt,
    };

    // Atomic: report row, report input, audio status flip, and outbox
    // analytics rows all commit together. If any one fails, none persist
    // and the audio remains in UPLOADED state, eligible for retry/delete.
    await this.tx.run(async () => {
      await this.reports.saveReport(report);
      await this.reports.saveReportInput(input);
      await this.audioUploads.update(linkedUpload);
      await this.trackEvent.trackBestEffort({
        sessionId: command.sessionId ?? upload.sessionId,
        reportId,
        eventType: AnalyticsEventType.REPORT_GENERATED,
        payload: {
          source: ReportSource.AUDIO_RECORDING,
          audioUploadId: command.audioUploadId,
        },
      });
    });

    this.metrics?.reportsCreatedTotal.inc({ source: ReportSource.AUDIO_RECORDING });

    // Post-commit, privacy-aware audio cleanup. Failures here are logged but
    // do not roll back the report — the user already has their result.
    let deletionStatus: 'disabled' | 'deleted' | 'failed' = 'disabled';
    if (this.config.audioUpload.autoDeleteAfterProcessing) {
      try {
        await this.storage.deleteObject(upload.storageKey);
        const deletedAt = this.clock.now().toISOString();
        await this.audioUploads.update({
          ...linkedUpload,
          status: AudioStatus.DELETED,
          deletedAt,
          updatedAt: deletedAt,
        });
        deletionStatus = 'deleted';
      } catch (error) {
        deletionStatus = 'failed';
        this.logger.warn(
          { err: error, audioUploadId: command.audioUploadId, reportId },
          'audio auto-delete failed after report creation',
        );
      }
    }

    // Best-effort queue enqueue (downstream observability hook only).
    try {
      await this.queue.enqueue(AUDIO_PROCESSING_QUEUE, {
        audioUploadId: command.audioUploadId,
        reportId,
        phase: 'report_created_placeholder',
      });
    } catch (error) {
      this.logger.warn(
        { err: error, audioUploadId: command.audioUploadId, reportId },
        'post-report queue enqueue failed (ignored)',
      );
    }

    // Post-commit analytics for audio specifics (auto-delete result is only
    // known after the transaction closes, so this one stays outside).
    await this.trackEvent.trackBestEffort({
      sessionId: command.sessionId ?? upload.sessionId,
      reportId,
      eventType: AnalyticsEventType.REPORT_CREATED_FROM_AUDIO,
      payload: {
        audioUploadId: command.audioUploadId,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        durationSeconds: upload.durationSeconds,
        analysisMode: ai.meta.source === 'model' ? 'ai_model' : 'deterministic_fallback',
        aiProvider: ai.meta.provider,
        aiModel: ai.meta.model,
        aiLatencyMs: ai.meta.latencyMs,
        aiFallbackUsed: ai.meta.fallbackUsed,
        audioAutoDelete: deletionStatus,
      },
    });

    return report;
  }
}
