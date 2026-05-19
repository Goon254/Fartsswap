import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AudioUpload, Report } from '../../../shared/domain/models';
import { AudioStatus, ReportSource } from '../../../shared/domain/types';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../../../shared/application/ports/object-storage.port';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from '../../audio/application/ports/audio-upload.repository';
import { REPORT_REPOSITORY, type ReportRepository } from './ports/report.repository';

export interface ReportPlaybackMeta {
  playbackAvailable: boolean;
  audioContentType?: string;
}

export interface ReportAudioContentResult {
  body: Buffer;
  contentType: string;
}

@Injectable()
export class GetReportAudioContentUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly audioUploads: AudioUploadRepository,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
  ) {}

  async getPlaybackMeta(reportId: string, sessionId: string): Promise<ReportPlaybackMeta> {
    const upload = await this.resolveSessionOwnedUpload(reportId, sessionId);
    if (!upload) {
      return { playbackAvailable: false };
    }
    return { playbackAvailable: true, audioContentType: upload.mimeType };
  }

  async getContent(reportId: string, sessionId: string): Promise<ReportAudioContentResult> {
    const upload = await this.resolveSessionOwnedUpload(reportId, sessionId);
    if (!upload) {
      throw new NotFoundException(`Playback not available for report ${reportId}`);
    }

    const stored = await this.storage.getObject(upload.storageKey);
    return {
      body: stored.body,
      contentType: stored.contentType ?? upload.mimeType ?? 'application/octet-stream',
    };
  }

  private async resolveSessionOwnedUpload(
    reportId: string,
    sessionId: string,
  ): Promise<AudioUpload | null> {
    const report = await this.reports.findReportById(reportId);
    if (!report || !this.isPlaybackEligibleReport(report)) {
      return null;
    }
    if (!report.sessionId || report.sessionId !== sessionId) {
      return null;
    }

    const input = await this.reports.findReportInputByReportId(reportId);
    if (!input?.audioUploadId) {
      return null;
    }

    const upload = await this.audioUploads.findById(input.audioUploadId);
    if (!upload || upload.status === AudioStatus.DELETED) {
      return null;
    }
    if (upload.sessionId && upload.sessionId !== sessionId) {
      return null;
    }
    if (upload.reportId && upload.reportId !== reportId) {
      return null;
    }
    if (!upload.storageKey?.trim()) {
      return null;
    }

    return upload;
  }

  private isPlaybackEligibleReport(report: Report): boolean {
    return report.source === ReportSource.AUDIO_RECORDING;
  }
}
