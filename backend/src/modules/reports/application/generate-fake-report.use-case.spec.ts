import { GenerateFakeReportUseCase } from './generate-fake-report.use-case';
import type { ReportRepository } from './ports/report.repository';
import type { ClockPort } from '../../../shared/application/ports/clock.port';
import type { IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { ReportSource, ReportStatus, AnalyticsEventType } from '../../../shared/domain/types';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';

describe('GenerateFakeReportUseCase', () => {
  const fixedNow = new Date('2026-05-17T12:00:00.000Z');
  let reportRepo: jest.Mocked<ReportRepository>;
  let ids: IdGeneratorPort;
  let trackEvent: jest.Mocked<Pick<TrackAnalyticsEventUseCase, 'execute'>>;
  let useCase: GenerateFakeReportUseCase;
  let idCounter: number;

  beforeEach(() => {
    idCounter = 0;
    reportRepo = {
      saveReport: jest.fn().mockResolvedValue(undefined),
      saveReportInput: jest.fn().mockResolvedValue(undefined),
      findReportById: jest.fn(),
    };
    ids = {
      generate: jest.fn(() => {
        idCounter += 1;
        return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
      }),
    };
    const clock: ClockPort = { now: () => fixedNow };
    trackEvent = { execute: jest.fn().mockResolvedValue({}) };
    useCase = new GenerateFakeReportUseCase(
      reportRepo,
      ids,
      clock,
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );
  });

  it('persists a completed fake report and input', async () => {
    const report = await useCase.execute({
      sessionId: 'session-1',
      customFartName: 'Thunder Bean',
      tonePreset: 'dramatic',
    });

    expect(report.status).toBe(ReportStatus.COMPLETED);
    expect(report.source).toBe(ReportSource.FAKE);
    expect(report.sessionId).toBe('session-1');
    expect(report.fartName).toBe('Thunder Bean');
    expect(report.classification).toBeTruthy();
    expect(reportRepo.saveReport).toHaveBeenCalledWith(report);
    expect(reportRepo.saveReportInput).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: report.id,
        customFartName: 'Thunder Bean',
        tonePreset: 'dramatic',
        source: ReportSource.FAKE,
      }),
    );
    expect(trackEvent.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        reportId: report.id,
        eventType: AnalyticsEventType.REPORT_GENERATED,
      }),
    );
  });
});
