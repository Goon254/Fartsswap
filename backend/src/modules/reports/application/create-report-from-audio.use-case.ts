import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Report, ReportInput } from '../../../shared/domain/models';
import {
  AnalyticsEventType,
  AudioStatus,
  ReportSource,
  ReportStatus,
} from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { QUEUE_PORT, type QueuePort } from '../../../shared/application/ports/queue.port';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from '../../audio/application/ports/audio-upload.repository';
import { AUDIO_PROCESSING_QUEUE } from '../../audio/application/upload-audio.use-case';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { generateFakeReportFields } from '../domain/fake-report-generator';
import { REPORT_REPOSITORY, type ReportRepository } from './ports/report.repository';

export interface CreateReportFromAudioCommand {
  audioUploadId: string;
  sessionId?: string;
  customFartName?: string;
  tonePreset?: string;
}

/**
 * Creates a report from an uploaded audio clip using placeholder analysis (fake generator).
 * TODO: Replace fake field generation with real AI + waveform pipeline; keep HTTP/DB contract stable.
 */
@Injectable()
export class CreateReportFromAudioUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly audioUploads: AudioUploadRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
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
    const durationMs = upload.durationSeconds
      ? Math.round(upload.durationSeconds * 1000)
      : undefined;

    const seed = `${reportId}:audio:${command.audioUploadId}:${command.customFartName ?? ''}`;
    const generated = generateFakeReportFields({
      customFartName: command.customFartName,
      tonePreset: command.tonePreset,
      seed,
    });

    const report: Report = {
      id: reportId,
      sessionId: command.sessionId ?? upload.sessionId,
      status: ReportStatus.COMPLETED,
      source: ReportSource.AUDIO_RECORDING,
      fartName: generated.fartName,
      classification: generated.classification,
      powerScore: generated.powerScore,
      durationMs: durationMs ?? generated.durationMs,
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
      audioUploadId: command.audioUploadId,
      customFartName: command.customFartName,
      tonePreset: command.tonePreset,
      durationMs: durationMs ?? generated.durationMs,
      source: ReportSource.AUDIO_RECORDING,
      createdAt: now.toISOString(),
    };

    await this.reports.saveReport(report);
    await this.reports.saveReportInput(input);

    const processedAt = now.toISOString();
    await this.audioUploads.update({
      ...upload,
      reportId,
      status: AudioStatus.PROCESSED,
      updatedAt: processedAt,
      processedAt,
    });

    await this.queue.enqueue(AUDIO_PROCESSING_QUEUE, {
      audioUploadId: command.audioUploadId,
      reportId,
      phase: 'report_created_placeholder',
    });

    await this.trackEvent.execute({
      sessionId: command.sessionId ?? upload.sessionId,
      reportId,
      eventType: AnalyticsEventType.REPORT_CREATED_FROM_AUDIO,
      payload: {
        audioUploadId: command.audioUploadId,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        durationSeconds: upload.durationSeconds,
        analysisMode: 'placeholder_fake_generator',
      },
    });

    await this.trackEvent.execute({
      sessionId: command.sessionId ?? upload.sessionId,
      reportId,
      eventType: AnalyticsEventType.REPORT_GENERATED,
      payload: {
        source: ReportSource.AUDIO_RECORDING,
        audioUploadId: command.audioUploadId,
      },
    });

    return report;
  }
}
