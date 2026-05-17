import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArtifactStatus, ArtifactType, ReportSource, ReportStatus } from '../../../shared/domain/types';
import type { ClockPort } from '../../../shared/application/ports/clock.port';
import type { IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import type { ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import type { Report, ReportArtifact } from '../../../shared/domain/models';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import type { ReportRepository } from '../../reports/application/ports/report.repository';
import { fakeTransactionPort, fakeTrackAnalytics } from '../../../../test/helpers/mock-transaction';
import { GeneratePdfReportArtifactUseCase } from './generate-pdf-report-artifact.use-case';
import type { ReportArtifactRepository } from './ports/report-artifact.repository';

const fixedNow = new Date('2026-05-17T12:00:00.000Z');
const report: Report = {
  id: 'report-1',
  sessionId: 'sess-1',
  status: ReportStatus.COMPLETED,
  source: ReportSource.FAKE,
  fartName: 'Test Emission',
  classification: 'Silent Assassin',
  powerScore: 42,
  durationMs: 1200,
  emotionalTone: 'Clinically unnecessary',
  probableCause: 'Late-night legume symposium',
  cinematicParallel: 'A deleted scene from a courtroom drama',
  threatLevel: 'Amber',
  fartHash: 'fart_aaaaaaaaaaaaaaaa',
  createdAt: fixedNow.toISOString(),
  updatedAt: fixedNow.toISOString(),
  completedAt: fixedNow.toISOString(),
};

function build(opts?: { reportOverride?: Report | null; existing?: ReportArtifact | null }) {
  const reports = {
    saveReport: jest.fn(),
    saveReportInput: jest.fn(),
    findReportById: jest
      .fn()
      .mockResolvedValue(opts?.reportOverride === undefined ? report : opts.reportOverride),
  } as unknown as jest.Mocked<ReportRepository>;

  const saved: ReportArtifact[] = [];
  const artifacts: jest.Mocked<ReportArtifactRepository> = {
    save: jest.fn(async (a: ReportArtifact) => {
      saved.push(a);
    }),
    update: jest.fn(async (a: ReportArtifact) => {
      saved.push(a);
    }),
    findById: jest.fn(),
    findByReportId: jest.fn(),
    findReadyByReportTypeTheme: jest.fn().mockResolvedValue(opts?.existing ?? null),
  };

  const ids: IdGeneratorPort = { generate: jest.fn().mockReturnValue('artifact-1') };
  const clock: ClockPort = { now: () => fixedNow };
  const storage: jest.Mocked<ObjectStoragePort> = {
    putObject: jest.fn().mockResolvedValue('key'),
    getObject: jest.fn(),
    deleteObject: jest.fn(),
    getSignedUrl: jest.fn(),
  };
  const trackEvent = fakeTrackAnalytics();

  const useCase = new GeneratePdfReportArtifactUseCase(
    reports,
    artifacts,
    ids,
    clock,
    storage,
    fakeTransactionPort(),
    trackEvent as unknown as TrackAnalyticsEventUseCase,
  );

  return { useCase, reports, artifacts, storage, trackEvent, saved };
}

describe('GeneratePdfReportArtifactUseCase', () => {
  it('renders a PDF, stores it, and returns a READY artifact', async () => {
    const { useCase, storage, artifacts, trackEvent } = build();

    const out = await useCase.execute({
      reportId: 'report-1',
      sessionId: 'sess-1',
      themeCode: 'default',
    });

    expect(out.status).toBe(ArtifactStatus.READY);
    expect(out.type).toBe(ArtifactType.REPORT_PDF);
    expect(out.themeCode).toBe('default');
    expect(out.mimeType).toBe('application/pdf');
    expect(out.storageKey).toMatch(/^artifacts\/report_pdf\/report-1\//);

    expect(storage.putObject).toHaveBeenCalledTimes(1);
    const putArg = storage.putObject.mock.calls[0]?.[0];
    expect(putArg?.contentType).toBe('application/pdf');
    expect(Buffer.isBuffer(putArg?.body)).toBe(true);
    expect((putArg?.body as Buffer).subarray(0, 5).toString('ascii')).toBe('%PDF-');

    // PENDING -> PROCESSING via tx + READY post-success = 3 writes total.
    expect(artifacts.save).toHaveBeenCalled();
    expect(artifacts.update).toHaveBeenCalled();

    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'pdf.artifact_requested' }),
    );
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'pdf.artifact_generated',
        payload: expect.objectContaining({ themeCode: 'default' }),
      }),
    );
  });

  it('coerces unknown themeCode to default without rejecting the request', async () => {
    const { useCase } = build();
    const out = await useCase.execute({
      reportId: 'report-1',
      sessionId: 'sess-1',
      themeCode: 'i-do-not-exist',
    });
    expect(out.themeCode).toBe('default');
  });

  it('honours premium themes when explicitly requested', async () => {
    const { useCase, storage } = build();
    const out = await useCase.execute({
      reportId: 'report-1',
      sessionId: 'sess-1',
      themeCode: 'clinical_gold',
    });
    expect(out.themeCode).toBe('clinical_gold');
    const stored = storage.putObject.mock.calls[0]?.[0]?.body as Buffer;
    expect(stored.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('returns the existing artifact for repeated (reportId, themeCode) without re-rendering', async () => {
    const existing: ReportArtifact = {
      id: 'artifact-already',
      reportId: 'report-1',
      type: ArtifactType.REPORT_PDF,
      status: ArtifactStatus.READY,
      storageKey: 'artifacts/report_pdf/report-1/artifact-already.pdf',
      mimeType: 'application/pdf',
      themeCode: 'default',
      createdAt: fixedNow.toISOString(),
      updatedAt: fixedNow.toISOString(),
      completedAt: fixedNow.toISOString(),
    };
    const { useCase, storage, artifacts } = build({ existing });

    const out = await useCase.execute({
      reportId: 'report-1',
      sessionId: 'sess-1',
      themeCode: 'default',
    });

    expect(out.id).toBe('artifact-already');
    expect(storage.putObject).not.toHaveBeenCalled();
    expect(artifacts.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the report does not exist', async () => {
    const { useCase } = build({ reportOverride: null });
    await expect(
      useCase.execute({ reportId: 'missing', sessionId: 'sess-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when a different session asks for the PDF', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ reportId: 'report-1', sessionId: 'other-session' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
