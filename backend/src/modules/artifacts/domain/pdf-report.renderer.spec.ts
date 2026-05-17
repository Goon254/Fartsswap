import type { Report } from '../../../shared/domain/models';
import { ReportSource, ReportStatus } from '../../../shared/domain/types';
import { renderReportPdf } from './pdf-report.renderer';

const PDF_HEADER_MAGIC = Buffer.from('%PDF-', 'ascii');

const report: Report = {
  id: 'report-1',
  sessionId: 'sess-1',
  status: ReportStatus.COMPLETED,
  source: ReportSource.FAKE,
  fartName: 'The Velvet Decree',
  classification: 'Silent Assassin',
  powerScore: 73,
  durationMs: 1850,
  emotionalTone: 'Wistful defiance',
  probableCause: 'Late-night legume symposium',
  cinematicParallel: 'A deleted scene from a courtroom drama',
  threatLevel: 'Amber',
  fartHash: 'fart_abcdef0123456789',
  createdAt: '2026-05-17T12:00:00.000Z',
  updatedAt: '2026-05-17T12:00:00.000Z',
  completedAt: '2026-05-17T12:00:00.000Z',
};

describe('renderReportPdf', () => {
  it('produces a valid application/pdf payload starting with %PDF-', async () => {
    const out = await renderReportPdf({ report, themeCode: 'default' });
    expect(out.mimeType).toBe('application/pdf');
    expect(out.body.length).toBeGreaterThan(500);
    expect(out.body.subarray(0, 5).equals(PDF_HEADER_MAGIC)).toBe(true);
  });

  it('honours an unknown theme by falling back to default without throwing', async () => {
    await expect(renderReportPdf({ report, themeCode: 'made_up_theme' })).resolves.toBeDefined();
  });

  it('renders premium themes without changing the byte-level contract', async () => {
    const gold = await renderReportPdf({ report, themeCode: 'clinical_gold' });
    const courtroom = await renderReportPdf({ report, themeCode: 'courtroom' });
    expect(gold.body.subarray(0, 5).equals(PDF_HEADER_MAGIC)).toBe(true);
    expect(courtroom.body.subarray(0, 5).equals(PDF_HEADER_MAGIC)).toBe(true);
  });

  it('handles edge-case input (very long strings, out-of-range score)', async () => {
    const edge: Report = {
      ...report,
      fartName: 'A '.repeat(200),
      probableCause: 'X'.repeat(400),
      cinematicParallel: 'Y'.repeat(400),
      powerScore: 9_999,
      durationMs: -50,
    };
    const out = await renderReportPdf({ report: edge, themeCode: 'default' });
    expect(out.body.subarray(0, 5).equals(PDF_HEADER_MAGIC)).toBe(true);
  });
});
