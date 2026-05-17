import { GenerateFakeReportUseCase } from './generate-fake-report.use-case';
import type { ReportRepository } from './ports/report.repository';
import type { ClockPort } from '../../../shared/application/ports/clock.port';
import type { IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { ReportSource, ReportStatus, AnalyticsEventType } from '../../../shared/domain/types';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { fakeTransactionPort, fakeTrackAnalytics } from '../../../../test/helpers/mock-transaction';
import { fakeOrchestrator } from '../../../../test/helpers/mock-ai-orchestrator';

describe('GenerateFakeReportUseCase', () => {
  const fixedNow = new Date('2026-05-17T12:00:00.000Z');
  let reportRepo: jest.Mocked<ReportRepository>;
  let ids: IdGeneratorPort;
  let trackEvent: ReturnType<typeof fakeTrackAnalytics>;
  let orchestrator: ReturnType<typeof fakeOrchestrator>;
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
    trackEvent = fakeTrackAnalytics();
    orchestrator = fakeOrchestrator({ fartName: 'Thunder Bean', threatLevel: 'Red' });
    useCase = new GenerateFakeReportUseCase(
      reportRepo,
      ids,
      clock,
      fakeTransactionPort(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
      orchestrator,
    );
  });

  it('persists a completed fake report using AI-orchestrated fields', async () => {
    const report = await useCase.execute({
      sessionId: 'session-1',
      customFartName: 'Thunder Bean',
      tonePreset: 'dramatic',
    });

    expect(report.status).toBe(ReportStatus.COMPLETED);
    expect(report.source).toBe(ReportSource.FAKE);
    expect(report.sessionId).toBe('session-1');
    expect(report.fartName).toBe('Thunder Bean');
    expect(report.threatLevel).toBe('Red');
    expect(reportRepo.saveReport).toHaveBeenCalledWith(report);
    expect(reportRepo.saveReportInput).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: report.id,
        customFartName: 'Thunder Bean',
        tonePreset: 'dramatic',
        source: ReportSource.FAKE,
      }),
    );

    // Orchestrator received a normalised request. Session id is forwarded
    // (used for quota accounting), but only the seed + source-shape inputs
    // ever reach the prompt builder.
    const aiCall = orchestrator.lastRequest();
    expect(aiCall).toEqual(
      expect.objectContaining({
        source: ReportSource.FAKE,
        customFartName: 'Thunder Bean',
        tonePreset: 'dramatic',
        sessionId: 'session-1',
      }),
    );

    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        reportId: report.id,
        eventType: AnalyticsEventType.REPORT_GENERATED,
        payload: expect.objectContaining({
          aiSource: 'model',
          aiProvider: 'openai',
          aiFallbackUsed: false,
        }),
      }),
    );
  });

  it('still produces a report when AI orchestrator returns fallback fields', async () => {
    orchestrator = fakeOrchestrator(
      { fartName: 'Emission 5000', classification: 'Silent Assassin' },
      {
        source: 'fallback',
        provider: 'deterministic',
        model: 'fallback',
        fallbackUsed: true,
        fallbackReason: 'provider_not_callable',
      },
    );
    useCase = new GenerateFakeReportUseCase(
      reportRepo,
      ids,
      { now: () => fixedNow },
      fakeTransactionPort(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
      orchestrator,
    );

    const report = await useCase.execute({ sessionId: 'sess', tonePreset: 'clinical' });

    expect(report.fartName).toBe('Emission 5000');
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          aiSource: 'fallback',
          aiFallbackUsed: true,
        }),
      }),
    );
  });
});
