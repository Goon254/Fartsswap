import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateReportFromAudioUseCase } from './create-report-from-audio.use-case';
import type { ReportRepository } from './ports/report.repository';
import type { AudioUploadRepository } from '../../audio/application/ports/audio-upload.repository';
import type { ClockPort } from '../../../shared/application/ports/clock.port';
import type { IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import type { QueuePort } from '../../../shared/application/ports/queue.port';
import type { ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import type { AppConfigService } from '../../../config/config.service';
import { AudioStatus, ReportSource, AnalyticsEventType } from '../../../shared/domain/types';
import { fakeTransactionPort, fakeTrackAnalytics } from '../../../../test/helpers/mock-transaction';
import { fakeOrchestrator } from '../../../../test/helpers/mock-ai-orchestrator';

describe('CreateReportFromAudioUseCase', () => {
  const fixedNow = new Date('2026-05-17T12:00:00.000Z');
  let reports: jest.Mocked<ReportRepository>;
  let audioUploads: jest.Mocked<AudioUploadRepository>;
  let trackEvent: ReturnType<typeof fakeTrackAnalytics>;
  let storage: jest.Mocked<ObjectStoragePort>;
  let config: AppConfigService;
  let orchestrator: ReturnType<typeof fakeOrchestrator>;
  let useCase: CreateReportFromAudioUseCase;
  let ids: IdGeneratorPort;
  let queue: QueuePort;

  beforeEach(() => {
    reports = {
      saveReport: jest.fn(),
      saveReportInput: jest.fn(),
      findReportById: jest.fn(),
      findReportByPublicSlug: jest.fn(),
    };
    audioUploads = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: 'audio-1',
        sessionId: 'sess-1',
        status: AudioStatus.UPLOADED,
        storageKey: 'audio/raw/sess-1/audio-1.webm',
        mimeType: 'audio/webm',
        sizeBytes: 100,
        durationSeconds: 2,
        createdAt: fixedNow.toISOString(),
        updatedAt: fixedNow.toISOString(),
      }),
    };
    trackEvent = fakeTrackAnalytics();
    storage = {
      putObject: jest.fn(),
      getObject: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
      getSignedUrl: jest.fn(),
    };
    config = {
      audioUpload: {
        maxBytes: 1024,
        allowedMimeTypes: ['audio/webm'],
        storagePrefix: 'audio/raw',
        autoDeleteAfterProcessing: false,
      },
    } as unknown as AppConfigService;
    const clock: ClockPort = { now: () => fixedNow };
    ids = {
      generate: jest
        .fn()
        .mockReturnValueOnce('report-1')
        .mockReturnValueOnce('input-1')
        .mockReturnValue('extra-id'),
    };
    queue = { enqueue: jest.fn().mockResolvedValue('job-1') };

    orchestrator = fakeOrchestrator();
    useCase = new CreateReportFromAudioUseCase(
      reports,
      audioUploads,
      ids,
      clock,
      queue,
      fakeTransactionPort(),
      storage,
      config,
      trackEvent as unknown as TrackAnalyticsEventUseCase,
      orchestrator,
    );
  });

  it('creates report linked to audio upload via the AI orchestrator', async () => {
    const report = await useCase.execute({
      audioUploadId: 'audio-1',
      sessionId: 'sess-1',
    });

    expect(report.source).toBe(ReportSource.AUDIO_RECORDING);
    expect(reports.saveReport).toHaveBeenCalled();
    expect(reports.saveReportInput).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUploadId: 'audio-1',
        source: ReportSource.AUDIO_RECORDING,
      }),
    );
    expect(audioUploads.update).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: 'report-1', status: AudioStatus.PROCESSED }),
    );
    expect(storage.deleteObject).not.toHaveBeenCalled();
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AnalyticsEventType.REPORT_CREATED_FROM_AUDIO,
        payload: expect.objectContaining({
          aiProvider: 'openai',
          aiFallbackUsed: false,
          analysisMode: 'ai_model',
        }),
      }),
    );

    // The orchestrator was called with the audio source + safe metadata only.
    const aiCall = orchestrator.lastRequest();
    expect(aiCall?.source).toBe(ReportSource.AUDIO_RECORDING);
    expect(aiCall?.audioMetadata).toEqual({ mimeType: 'audio/webm', sizeBytes: 100 });
  });

  it('reports analysisMode=deterministic_fallback when AI fell back', async () => {
    orchestrator = fakeOrchestrator(undefined, {
      source: 'fallback',
      provider: 'deterministic',
      model: 'fallback',
      fallbackUsed: true,
      fallbackReason: 'parse_not_json',
    });
    useCase = new CreateReportFromAudioUseCase(
      reports,
      audioUploads,
      ids,
      { now: () => fixedNow },
      queue,
      fakeTransactionPort(),
      storage,
      config,
      trackEvent as unknown as TrackAnalyticsEventUseCase,
      orchestrator,
    );

    await useCase.execute({ audioUploadId: 'audio-1', sessionId: 'sess-1' });

    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          analysisMode: 'deterministic_fallback',
          aiFallbackUsed: true,
        }),
      }),
    );
  });

  it('auto-deletes audio when AUDIO_AUTO_DELETE_AFTER_PROCESSING is enabled', async () => {
    (config.audioUpload as { autoDeleteAfterProcessing: boolean }).autoDeleteAfterProcessing = true;

    const report = await useCase.execute({
      audioUploadId: 'audio-1',
      sessionId: 'sess-1',
    });

    expect(report.id).toBeDefined();
    expect(storage.deleteObject).toHaveBeenCalledWith('audio/raw/sess-1/audio-1.webm');
    const lastUpdate = audioUploads.update.mock.calls.at(-1)?.[0];
    expect(lastUpdate?.status).toBe(AudioStatus.DELETED);
    expect(lastUpdate?.deletedAt).toBeDefined();
  });

  it('still commits report when auto-delete fails post-commit', async () => {
    (config.audioUpload as { autoDeleteAfterProcessing: boolean }).autoDeleteAfterProcessing = true;
    storage.deleteObject.mockRejectedValueOnce(new Error('s3 unreachable'));

    const report = await useCase.execute({
      audioUploadId: 'audio-1',
      sessionId: 'sess-1',
    });

    expect(report.id).toBeDefined();
    expect(reports.saveReport).toHaveBeenCalled();
    const lastUpdate = audioUploads.update.mock.calls.at(-1)?.[0];
    expect(lastUpdate?.status).toBe(AudioStatus.PROCESSED);
  });

  it('rejects wrong session', async () => {
    await expect(
      useCase.execute({ audioUploadId: 'audio-1', sessionId: 'other-session' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing upload', async () => {
    audioUploads.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ audioUploadId: 'missing', sessionId: 'sess-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
