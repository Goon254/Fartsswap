import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateReportFromAudioUseCase } from './create-report-from-audio.use-case';
import type { ReportRepository } from './ports/report.repository';
import type { AudioUploadRepository } from '../../audio/application/ports/audio-upload.repository';
import type { ClockPort } from '../../../shared/application/ports/clock.port';
import type { IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import type { QueuePort } from '../../../shared/application/ports/queue.port';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { AudioStatus, ReportSource, AnalyticsEventType } from '../../../shared/domain/types';

describe('CreateReportFromAudioUseCase', () => {
  const fixedNow = new Date('2026-05-17T12:00:00.000Z');
  let reports: jest.Mocked<ReportRepository>;
  let audioUploads: jest.Mocked<AudioUploadRepository>;
  let trackEvent: jest.Mocked<Pick<TrackAnalyticsEventUseCase, 'execute'>>;
  let useCase: CreateReportFromAudioUseCase;

  beforeEach(() => {
    reports = {
      saveReport: jest.fn(),
      saveReportInput: jest.fn(),
      findReportById: jest.fn(),
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
    trackEvent = { execute: jest.fn().mockResolvedValue({}) };
    const clock: ClockPort = { now: () => fixedNow };
    const ids: IdGeneratorPort = {
      generate: jest
        .fn()
        .mockReturnValueOnce('report-1')
        .mockReturnValueOnce('input-1'),
    };
    const queue: QueuePort = { enqueue: jest.fn().mockResolvedValue('job-1') };

    useCase = new CreateReportFromAudioUseCase(
      reports,
      audioUploads,
      ids,
      clock,
      queue,
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );
  });

  it('creates report linked to audio upload', async () => {
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
    expect(trackEvent.execute).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AnalyticsEventType.REPORT_CREATED_FROM_AUDIO }),
    );
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
