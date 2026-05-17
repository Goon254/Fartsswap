import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AudioUpload } from '../../../shared/domain/models';
import { AudioStatus } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { OBJECT_STORAGE_PORT, type ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from './ports/audio-upload.repository';

/**
 * Explicit user-initiated deletion of raw audio.
 * Allowed only while upload is unattached (no report) and still in UPLOADED state.
 */
@Injectable()
export class DeleteAudioUploadUseCase {
  constructor(
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly uploads: AudioUploadRepository,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(audioUploadId: string, sessionId?: string): Promise<AudioUpload> {
    const upload = await this.uploads.findById(audioUploadId);
    if (!upload || upload.status === AudioStatus.DELETED) {
      throw new NotFoundException(`Audio upload ${audioUploadId} not found`);
    }

    if (sessionId && upload.sessionId && upload.sessionId !== sessionId) {
      throw new NotFoundException(`Audio upload ${audioUploadId} not found`);
    }

    if (upload.reportId) {
      throw new ForbiddenException(
        'Cannot delete audio already linked to a report. Delete is only available before report creation.',
      );
    }

    if (upload.status !== AudioStatus.UPLOADED) {
      throw new ForbiddenException(
        `Cannot delete audio in status ${upload.status}. Only uploaded (unprocessed) clips may be deleted.`,
      );
    }

    await this.storage.deleteObject(upload.storageKey);

    const now = this.clock.now().toISOString();
    const deleted: AudioUpload = {
      ...upload,
      status: AudioStatus.DELETED,
      updatedAt: now,
      deletedAt: now,
    };
    await this.uploads.update(deleted);
    return deleted;
  }
}
