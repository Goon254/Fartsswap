import { Inject, Injectable } from '@nestjs/common';
import type { AudioUpload } from '../../../shared/domain/models';
import { AnalyticsEventType, AudioStatus } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { OBJECT_STORAGE_PORT, type ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import { QUEUE_PORT, type QueuePort } from '../../../shared/application/ports/queue.port';
import { AppConfigService } from '../../../config/config.service';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { validateAudioUpload, validateDurationSeconds } from '../domain/audio-upload.validator';
import {
  AUDIO_UPLOAD_REPOSITORY,
  type AudioUploadRepository,
} from './ports/audio-upload.repository';

export interface UploadAudioCommand {
  sessionId?: string;
  buffer: Buffer;
  mimeType: string;
  durationSeconds?: number;
  originalFilename?: string;
}

export const AUDIO_PROCESSING_QUEUE = 'audio-processing';

@Injectable()
export class UploadAudioUseCase {
  constructor(
    @Inject(AUDIO_UPLOAD_REPOSITORY) private readonly uploads: AudioUploadRepository,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort,
    private readonly config: AppConfigService,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async execute(command: UploadAudioCommand): Promise<AudioUpload> {
    const audioConfig = this.config.audioUpload;
    const uploadId = this.ids.generate();

    await this.trackEvent.execute({
      sessionId: command.sessionId,
      eventType: AnalyticsEventType.AUDIO_UPLOAD_REQUESTED,
      payload: {
        audioUploadId: uploadId,
        mimeType: command.mimeType,
        sizeBytes: command.buffer.length,
      },
    });

    try {
      validateDurationSeconds(command.durationSeconds);
      validateAudioUpload({
        mimeType: command.mimeType,
        sizeBytes: command.buffer.length,
        maxBytes: audioConfig.maxBytes,
        allowedMimeTypes: audioConfig.allowedMimeTypes,
      });

      const sessionSegment = command.sessionId ?? 'anonymous';
      const extension = this.extensionForMime(command.mimeType);
      const storageKey = `${audioConfig.storagePrefix}/${sessionSegment}/${uploadId}${extension}`;
      const now = this.clock.now();

      await this.storage.putObject({
        key: storageKey,
        body: command.buffer,
        contentType: command.mimeType,
      });

      const upload: AudioUpload = {
        id: uploadId,
        sessionId: command.sessionId,
        status: AudioStatus.UPLOADED,
        storageKey,
        mimeType: command.mimeType,
        sizeBytes: command.buffer.length,
        durationSeconds: command.durationSeconds,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await this.uploads.save(upload);

      await this.queue.enqueue(AUDIO_PROCESSING_QUEUE, {
        audioUploadId: uploadId,
        sessionId: command.sessionId,
        placeholder: true,
      });

      await this.trackEvent.execute({
        sessionId: command.sessionId,
        eventType: AnalyticsEventType.AUDIO_UPLOADED,
        payload: {
          audioUploadId: uploadId,
          mimeType: command.mimeType,
          sizeBytes: command.buffer.length,
          durationSeconds: command.durationSeconds,
        },
      });

      return upload;
    } catch (error) {
      await this.trackEvent.execute({
        sessionId: command.sessionId,
        eventType: AnalyticsEventType.AUDIO_UPLOAD_FAILED,
        payload: {
          audioUploadId: uploadId,
          mimeType: command.mimeType,
          sizeBytes: command.buffer.length,
          reason: error instanceof Error ? error.message : 'upload_failed',
        },
      });
      throw error;
    }
  }

  private extensionForMime(mimeType: string): string {
    if (mimeType === 'audio/webm') return '.webm';
    if (mimeType === 'audio/ogg') return '.ogg';
    if (mimeType === 'audio/mpeg') return '.mp3';
    return '.bin';
  }
}
