import { BadRequestException } from '@nestjs/common';
import { UploadAudioUseCase } from './upload-audio.use-case';
import type { AudioUploadRepository } from './ports/audio-upload.repository';
import type { ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import type { ClockPort } from '../../../shared/application/ports/clock.port';
import type { IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import type { QueuePort } from '../../../shared/application/ports/queue.port';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { AnalyticsEventType, AudioStatus } from '../../../shared/domain/types';
import type { AppConfigService } from '../../../config/config.service';
import { fakeTrackAnalytics } from '../../../../test/helpers/mock-transaction';

// Minimal valid WebM/Matroska header so the magic-byte sniffer accepts the
// payload. The detector looks for EBML magic + "webm" / "matroska" inside
// the first 1KB; we provide both.
const VALID_WEBM_HEADER = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
  Buffer.from('webm'),
  Buffer.from('rest-of-payload'),
]);

describe('UploadAudioUseCase', () => {
  const fixedNow = new Date('2026-05-17T12:00:00.000Z');
  let uploads: jest.Mocked<AudioUploadRepository>;
  let storage: jest.Mocked<ObjectStoragePort>;
  let trackEvent: ReturnType<typeof fakeTrackAnalytics>;
  let useCase: UploadAudioUseCase;

  const config = {
    audioUpload: {
      maxBytes: 1024,
      allowedMimeTypes: ['audio/webm'],
      storagePrefix: 'audio/raw',
      autoDeleteAfterProcessing: false,
    },
  } as unknown as AppConfigService;

  beforeEach(() => {
    uploads = { save: jest.fn(), update: jest.fn(), findById: jest.fn() };
    storage = {
      putObject: jest.fn().mockResolvedValue('key'),
      getObject: jest.fn(),
      deleteObject: jest.fn(),
      getSignedUrl: jest.fn(),
    };
    trackEvent = fakeTrackAnalytics();
    const clock: ClockPort = { now: () => fixedNow };
    const ids: IdGeneratorPort = { generate: () => 'audio-1' };
    const queue: QueuePort = { enqueue: jest.fn().mockResolvedValue('job-1') };

    useCase = new UploadAudioUseCase(
      uploads,
      storage,
      ids,
      clock,
      queue,
      config,
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );
  });

  it('stores upload and emits analytics', async () => {
    const result = await useCase.execute({
      sessionId: 'sess-1',
      buffer: VALID_WEBM_HEADER,
      mimeType: 'audio/webm',
      durationSeconds: 2,
    });

    expect(result.status).toBe(AudioStatus.UPLOADED);
    expect(result.mimeType).toBe('audio/webm');
    expect(result.storageKey).toContain('audio/raw/sess-1/audio-1');
    expect(storage.putObject).toHaveBeenCalled();
    expect(uploads.save).toHaveBeenCalled();
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AnalyticsEventType.AUDIO_UPLOADED }),
    );
  });

  it('emits failure analytics on validation error (unsupported mime header)', async () => {
    await expect(
      useCase.execute({
        buffer: Buffer.from('x'),
        mimeType: 'audio/wav',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AnalyticsEventType.AUDIO_UPLOAD_FAILED }),
    );
  });

  it('rejects spoofed MIME when bytes are not actually audio', async () => {
    // Client lies and says audio/webm; payload is just text.
    await expect(
      useCase.execute({
        buffer: Buffer.from('not actually audio bytes here, just text'),
        mimeType: 'audio/webm',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.putObject).not.toHaveBeenCalled();
    expect(uploads.save).not.toHaveBeenCalled();
  });
});
