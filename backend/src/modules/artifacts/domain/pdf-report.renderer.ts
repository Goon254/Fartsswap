import PDFDocument from 'pdfkit';
import type { Report } from '../../../shared/domain/models';
import { getPdfTheme, type PdfTheme } from './pdf-themes';

/**
 * Programmatic PDF renderer for the diagnostic dossier.
 *
 * Uses `pdfkit` so we don't carry a headless browser dependency. Layout is a
 * single A4 page split into:
 *   1. Header band — Bureau of Acoustic Gasology + theme display name.
 *   2. Title block — fart name + classification + threat pill.
 *   3. Stats grid — power score bar, duration, threat level, confidence.
 *   4. Body text — short summary, probable cause, cinematic parallel,
 *      emotional tone.
 *   5. Footer — hash, timestamp, Farts.com watermark + faux seal.
 *
 * All text is sourced from the persisted `Report` (which has already been
 * AI-validated + safety-filtered by Phase 6). The renderer adds NO new
 * semantic content; it only formats existing strings, so brand-safety is
 * preserved end-to-end.
 *
 * Output is a single `Buffer` of `application/pdf` bytes — small enough to
 * stream from memory for the single-page case (< 50 KB typical).
 */

export interface RenderedPdf {
  body: Buffer;
  mimeType: 'application/pdf';
}

export interface PdfRenderPayload {
  report: Report;
  themeCode: string;
}

export function renderReportPdf(payload: PdfRenderPayload): Promise<RenderedPdf> {
  const theme = getPdfTheme(payload.themeCode);
  return new Promise<RenderedPdf>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Farts.com Diagnostic Dossier — ${payload.report.fartName}`,
        Author: 'Bureau of Acoustic Gasology',
        Subject: 'Parody diagnostic report. No medical value. Immense cultural value.',
        Producer: 'Farts.com',
        CreationDate: new Date(payload.report.completedAt ?? payload.report.createdAt),
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      resolve({ body: Buffer.concat(chunks), mimeType: 'application/pdf' });
    });
    doc.on('error', (err: Error) => reject(err));

    try {
      drawDocument(doc, payload.report, theme);
      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('PDF render failed'));
    }
  });
}

function drawDocument(doc: PDFKit.PDFDocument, report: Report, theme: PdfTheme): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;
  const innerWidth = pageWidth - margin * 2;

  // --- Paper tint (if not pure white) ---
  doc.save();
  doc.rect(0, 0, pageWidth, pageHeight).fill(theme.paper);
  doc.restore();

  // --- Header band ---
  const headerHeight = 90;
  doc.save();
  doc.rect(0, 0, pageWidth, headerHeight).fill(theme.accent);
  doc.fillColor(theme.accentText).font('Helvetica-Bold').fontSize(11);
  doc.text('BUREAU OF ACOUSTIC GASOLOGY', margin, 24, {
    characterSpacing: 1.5,
  });
  doc.font('Helvetica').fontSize(9);
  doc.text(theme.displayName.toUpperCase(), margin, 42, { characterSpacing: 1 });
  doc.font('Helvetica-Bold').fontSize(20);
  doc.text('Diagnostic Dossier', margin, 56);
  doc.restore();

  // --- Title block ---
  let cursorY = headerHeight + 28;
  doc.fillColor(theme.muted).font('Helvetica').fontSize(8);
  doc.text('SUBJECT', margin, cursorY, { characterSpacing: 1.2 });
  cursorY += 12;
  doc.fillColor(theme.body).font('Helvetica-Bold').fontSize(22);
  doc.text(truncate(report.fartName, 60), margin, cursorY, { width: innerWidth });
  cursorY = doc.y + 4;

  doc.fillColor(theme.muted).font('Helvetica').fontSize(8);
  doc.text('CLASSIFICATION', margin, cursorY, { characterSpacing: 1.2 });
  cursorY += 12;
  doc.fillColor(theme.body).font('Helvetica-Bold').fontSize(13);
  doc.text(truncate(report.classification, 60), margin, cursorY);
  cursorY = doc.y + 18;

  // --- Stats grid (2 columns) ---
  const columnWidth = (innerWidth - 16) / 2;
  const leftX = margin;
  const rightX = margin + columnWidth + 16;

  cursorY = drawStat(doc, theme, leftX, cursorY, columnWidth, 'POWER SCORE', String(clampInt(report.powerScore, 0, 100)) + ' / 100');
  drawScoreBar(doc, theme, leftX, cursorY, columnWidth, clampInt(report.powerScore, 0, 100));
  cursorY += 16;
  cursorY = drawStat(doc, theme, leftX, cursorY, columnWidth, 'DURATION', `${(report.durationMs / 1000).toFixed(2)} s`);

  let rightY = headerHeight + 28 + 12 + 22 + 4 + 12 + 13 + 18;
  rightY = drawStat(doc, theme, rightX, rightY, columnWidth, 'THREAT LEVEL', truncate(report.threatLevel, 24));
  drawThreatPill(doc, theme, rightX, rightY, report.threatLevel);
  rightY += 24;
  drawStat(doc, theme, rightX, rightY, columnWidth, 'EMOTIONAL TONE', truncate(report.emotionalTone, 40));

  // --- Body paragraphs ---
  let bodyY = Math.max(cursorY, rightY) + 28;
  bodyY = drawParagraph(doc, theme, margin, bodyY, innerWidth, 'PROBABLE CAUSE', report.probableCause);
  drawParagraph(doc, theme, margin, bodyY, innerWidth, 'CINEMATIC PARALLEL', report.cinematicParallel);

  // --- Faux seal + footer ---
  drawFootSeal(doc, theme, pageWidth, pageHeight, margin);
  drawFooter(doc, theme, report, margin, pageWidth, pageHeight);
}

function drawStat(
  doc: PDFKit.PDFDocument,
  theme: PdfTheme,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
): number {
  doc.fillColor(theme.muted).font('Helvetica').fontSize(8);
  doc.text(label, x, y, { width, characterSpacing: 1.2 });
  doc.fillColor(theme.body).font('Helvetica-Bold').fontSize(13);
  doc.text(value, x, y + 12, { width });
  return y + 12 + 16;
}

function drawScoreBar(
  doc: PDFKit.PDFDocument,
  theme: PdfTheme,
  x: number,
  y: number,
  width: number,
  score: number,
): void {
  const height = 6;
  doc.save();
  doc.roundedRect(x, y, width, height, 3).fill('#E2E8F0');
  const fillWidth = Math.max(1, (width * score) / 100);
  doc.roundedRect(x, y, fillWidth, height, 3).fill(theme.accent);
  doc.restore();
}

function drawThreatPill(
  doc: PDFKit.PDFDocument,
  theme: PdfTheme,
  x: number,
  y: number,
  label: string,
): void {
  const text = truncate(label, 16);
  doc.save();
  doc.font('Helvetica-Bold').fontSize(9);
  const width = doc.widthOfString(text) + 18;
  doc.roundedRect(x, y, width, 16, 4).fill(theme.threatRing);
  doc.fillColor('#FFFFFF').text(text, x + 9, y + 4);
  doc.restore();
}

function drawParagraph(
  doc: PDFKit.PDFDocument,
  theme: PdfTheme,
  x: number,
  y: number,
  width: number,
  label: string,
  bodyText: string,
): number {
  doc.fillColor(theme.muted).font('Helvetica').fontSize(8);
  doc.text(label, x, y, { width, characterSpacing: 1.2 });
  doc.fillColor(theme.body).font('Helvetica').fontSize(11);
  doc.text(truncate(bodyText, 220), x, y + 12, { width, lineGap: 2 });
  return doc.y + 14;
}

function drawFootSeal(
  doc: PDFKit.PDFDocument,
  theme: PdfTheme,
  pageWidth: number,
  pageHeight: number,
  margin: number,
): void {
  const cx = pageWidth - margin - 36;
  const cy = pageHeight - margin - 60;
  doc.save();
  doc.lineWidth(1.5).strokeColor(theme.accent);
  doc.circle(cx, cy, 32).stroke();
  doc.circle(cx, cy, 26).stroke();
  doc.fillColor(theme.accent).font('Helvetica-Bold').fontSize(7);
  doc.text('CERTIFIED', cx - 22, cy - 14, { width: 44, align: 'center' });
  doc.fontSize(10);
  doc.text('B.A.G.', cx - 22, cy - 4, { width: 44, align: 'center' });
  doc.font('Helvetica').fontSize(6);
  doc.text('Bureau of Acoustic Gasology', cx - 60, cy + 10, {
    width: 120,
    align: 'center',
  });
  doc.restore();
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  theme: PdfTheme,
  report: Report,
  margin: number,
  pageWidth: number,
  pageHeight: number,
): void {
  const y = pageHeight - margin - 18;
  doc.fillColor(theme.muted).font('Helvetica').fontSize(8);
  doc.text(`Hash: ${report.fartHash}`, margin, y);
  doc.text(`Issued: ${formatTimestamp(report.completedAt ?? report.createdAt)}`, margin, y + 10);
  doc.fontSize(8).fillColor(theme.muted);
  const watermark = 'Farts.com • Parody diagnostic. No medical value.';
  const wmWidth = doc.widthOfString(watermark);
  doc.text(watermark, pageWidth - margin - wmWidth, y + 10);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function truncate(value: string, max: number): string {
  if (typeof value !== 'string') return '';
  const v = value.replace(/\s+/g, ' ').trim();
  return v.length <= max ? v : `${v.slice(0, max - 1)}…`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().replace('T', ' ').replace(/\..+$/, ' UTC');
}
