import { NotFoundException } from '@nestjs/common';
import { GenerateShareCardArtifactUseCase } from './generate-share-card-artifact.use-case';
import type { ReportArtifactRepository } from './ports/report-artifact.repository';
import type { ReportRepository } from '../../reports/application/ports/report.repository';
import type { ClockPort } from '../../../shared/application/ports/clock.port';
import type { IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import type { QueuePort } from '../../../shared/application/ports/queue.port';
import type { ShareCardArtifactGenerator } from './share-card-artifact.generator';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import {
  AnalyticsEventType,
  ArtifactStatus,
  ArtifactType,
  ReportSource,
  ReportStatus,
} from '../../../shared/domain/types';
import { fakeTransactionPort, fakeTrackAnalytics } from '../../../../test/helpers/mock-transaction';

describe('GenerateShareCardArtifactUseCase', () => {
  const fixedNow = new Date('2026-05-17T12:00:00.000Z');
  let reports: jest.Mocked<ReportRepository>;
  let artifacts: jest.Mocked<ReportArtifactRepository>;
  let queue: jest.Mocked<QueuePort>;
  let generator: jest.Mocked<Pick<ShareCardArtifactGenerator, 'generate'>>;
  let trackEvent: ReturnType<typeof fakeTrackAnalytics>;
  let useCase: GenerateShareCardArtifactUseCase;

  beforeEach(() => {
    reports = {
      saveReport: jest.fn(),
      saveReportInput: jest.fn(),
      findReportById: jest.fn().mockResolvedValue({
        id: 'report-1',
        status: ReportStatus.COMPLETED,
        source: ReportSource.FAKE,
        fartName: 'Bean',
        classification: 'Silent Assassin',
        powerScore: 50,
        durationMs: 1000,
        emotionalTone: 'Calm',
        probableCause: 'Chili',
        cinematicParallel: 'Drama',
        threatLevel: 'Green',
        fartHash: 'fart_x',
        createdAt: fixedNow.toISOString(),
        updatedAt: fixedNow.toISOString(),
      }),
    };
    artifacts = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByReportId: jest.fn(),
    };
    queue = { enqueue: jest.fn().mockResolvedValue('job-1') };
    generator = {
      generate: jest.fn().mockResolvedValue({
        storageKey: 'artifacts/share_card/report-1/art-1.html',
        mimeType: 'text/html; charset=utf-8',
      }),
    };
    trackEvent = fakeTrackAnalytics();
    const clock: ClockPort = { now: () => fixedNow };
    const ids: IdGeneratorPort = { generate: () => 'art-1' };

    useCase = new GenerateShareCardArtifactUseCase(
      reports,
      artifacts,
      ids,
      clock,
      queue,
      fakeTransactionPort(),
      generator as unknown as ShareCardArtifactGenerator,
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );
  });

  it('throws when report is missing', async () => {
    reports.findReportById.mockResolvedValue(null);
    await expect(useCase.execute({ reportId: 'missing' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists ready artifact and emits analytics', async () => {
    const result = await useCase.execute({ reportId: 'report-1', sessionId: 'sess-1' });

    expect(result.status).toBe(ArtifactStatus.READY);
    expect(result.type).toBe(ArtifactType.SHARE_CARD);
    expect(result.storageKey).toContain('artifacts/share_card/report-1');
    expect(artifacts.save).toHaveBeenCalled();
    expect(artifacts.update).toHaveBeenCalled();
    expect(queue.enqueue).toHaveBeenCalled();
    expect(generator.generate).toHaveBeenCalled();
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AnalyticsEventType.ARTIFACT_GENERATION_REQUESTED }),
    );
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AnalyticsEventType.ARTIFACT_GENERATED }),
    );
  });
});
