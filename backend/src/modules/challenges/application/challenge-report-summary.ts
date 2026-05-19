import { Inject, Injectable } from '@nestjs/common';
import type { Report } from '../../../shared/domain/models';
import { AudioStatus, ReportSource } from '../../../shared/domain/types';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from '../../audio/application/ports/audio-upload.repository';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';

export interface ChallengeReportSummary {
  reportId: string;
  fartName: string;
  classification: string;
  powerScore: number;
  threatLevel: string;
  probableCause: string;
  emotionalTone?: string;
  playbackAvailable: boolean;
  audioContentType?: string;
}

@Injectable()
export class ChallengeReportSummaryService {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly audioUploads: AudioUploadRepository,
  ) {}

  async summarizeReport(reportId: string | undefined): Promise<ChallengeReportSummary | undefined> {
    if (!reportId?.trim()) return undefined;
    const report = await this.reports.findReportById(reportId);
    if (!report) return undefined;

    const audio = await this.resolveReportAudio(report);
    return {
      reportId: report.id,
      fartName: report.fartName,
      classification: report.classification,
      powerScore: report.powerScore,
      threatLevel: report.threatLevel,
      probableCause: report.probableCause,
      emotionalTone: report.emotionalTone,
      playbackAvailable: audio != null,
      audioContentType: audio?.mimeType,
    };
  }

  private async resolveReportAudio(
    report: Report,
  ): Promise<{ mimeType: string; storageKey: string } | null> {
    if (report.source !== ReportSource.AUDIO_RECORDING) return null;
    const input = await this.reports.findReportInputByReportId(report.id);
    if (!input?.audioUploadId) return null;
    const upload = await this.audioUploads.findById(input.audioUploadId);
    if (!upload || upload.status === AudioStatus.DELETED) return null;
    if (!upload.storageKey?.trim()) return null;
    return { mimeType: upload.mimeType ?? 'application/octet-stream', storageKey: upload.storageKey };
  }
}
