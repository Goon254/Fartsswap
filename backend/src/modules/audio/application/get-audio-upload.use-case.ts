import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AudioUpload } from '../../../shared/domain/models';
import { AudioStatus } from '../../../shared/domain/types';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from './ports/audio-upload.repository';

@Injectable()
export class GetAudioUploadUseCase {
  constructor(
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly uploads: AudioUploadRepository,
  ) {}

  async execute(audioUploadId: string, sessionId?: string): Promise<AudioUpload> {
    const upload = await this.uploads.findById(audioUploadId);
    if (!upload || upload.status === AudioStatus.DELETED) {
      throw new NotFoundException(`Audio upload ${audioUploadId} not found`);
    }

    if (sessionId && upload.sessionId && upload.sessionId !== sessionId) {
      throw new NotFoundException(`Audio upload ${audioUploadId} not found`);
    }

    return upload;
  }
}
