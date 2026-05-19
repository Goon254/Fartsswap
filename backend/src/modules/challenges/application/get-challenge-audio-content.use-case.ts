import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../../../shared/application/ports/object-storage.port';
import { AudioStatus, ReportSource } from '../../../shared/domain/types';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from '../../audio/application/ports/audio-upload.repository';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { ChallengeLinkEntity } from '../infrastructure/persistence/challenge-link.entity';

export type ChallengeAudioRole = 'challenger' | 'response';

export interface ChallengeAudioContentResult {
  body: Buffer;
  contentType: string;
}

@Injectable()
export class GetChallengeAudioContentUseCase {
  constructor(
    @InjectRepository(ChallengeLinkEntity) private readonly links: Repository<ChallengeLinkEntity>,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly audioUploads: AudioUploadRepository,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
  ) {}

  async execute(challengeId: string, role: ChallengeAudioRole): Promise<ChallengeAudioContentResult> {
    const link = await this.links.findOne({ where: { id: challengeId } });
    if (!link) {
      throw new NotFoundException(`Challenge ${challengeId} not found`);
    }

    const reportId = role === 'challenger' ? link.reportId : link.responseReportId;
    if (!reportId) {
      throw new NotFoundException(`No ${role} report for challenge ${challengeId}`);
    }

    const report = await this.reports.findReportById(reportId);
    if (!report || report.source !== ReportSource.AUDIO_RECORDING) {
      throw new NotFoundException(`Playback not available for ${role} report`);
    }

    const input = await this.reports.findReportInputByReportId(reportId);
    if (!input?.audioUploadId) {
      throw new NotFoundException(`Playback not available for ${role} report`);
    }

    const upload = await this.audioUploads.findById(input.audioUploadId);
    if (!upload || upload.status === AudioStatus.DELETED || !upload.storageKey?.trim()) {
      throw new NotFoundException(`Playback not available for ${role} report`);
    }

    const stored = await this.storage.getObject(upload.storageKey);
    return {
      body: stored.body,
      contentType: stored.contentType ?? upload.mimeType ?? 'application/octet-stream',
    };
  }
}
