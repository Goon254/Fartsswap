import type { ShareCardRenderPayload } from './share-card-payload';
import { ShareCardStyleVariant } from '../../../shared/domain/types';

const VARIANT_ACCENT: Record<ShareCardStyleVariant, string> = {
  [ShareCardStyleVariant.DEFAULT]: '#1a3a5c',
  [ShareCardStyleVariant.CLINICAL]: '#0f4c5c',
  [ShareCardStyleVariant.DRAMATIC]: '#5c1a1a',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function threatColor(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized === 'red') return '#b91c1c';
  if (normalized === 'amber') return '#b45309';
  if (normalized === 'cerulean') return '#0369a1';
  return '#15803d';
}

function field(label: string, value: string): string {
  return [
    '<div class="row">',
    '<div class="label">' + escapeHtml(label) + '</div>',
    '<div class="value">' + escapeHtml(value) + '</div>',
    '</div>',
  ].join('');
}

/** Deterministic HTML diagnostic share card (Phase 3 can swap for PNG/PDF). */
export function renderShareCardHtml(payload: ShareCardRenderPayload): string {
  const accent = VARIANT_ACCENT[payload.styleVariant] ?? VARIANT_ACCENT[ShareCardStyleVariant.DEFAULT];
  const threat = escapeHtml(payload.threatLevel);
  const threatFg = threatColor(payload.threatLevel);
  const score = Math.min(100, Math.max(0, payload.powerScore));

  const html = [
    '<!DOCTYPE html><html lang="en"><head>',
    '<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<title>Fart Diagnostic — ' + escapeHtml(payload.fartName) + '</title>',
    '<style>',
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:Segoe UI,system-ui,sans-serif;background:#0b1220;display:flex;justify-content:center;padding:24px}',
    '.card{width:100%;max-width:420px;background:linear-gradient(165deg,#f8fafc,#e8eef5);border:2px solid ' + accent + ';border-radius:12px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.35)}',
    '.header{background:' + accent + ';color:#fff;padding:20px}',
    '.header h1{font-size:1.1rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;opacity:.9}',
    '.header h2{font-size:1.5rem;margin-top:6px;font-weight:700}',
    '.badge{display:inline-block;margin-top:12px;padding:4px 10px;background:rgba(255,255,255,.2);border-radius:4px;font-size:.75rem}',
    '.body{padding:20px}.row{margin-bottom:14px}',
    '.label{font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px}',
    '.value{font-size:.95rem;color:#0f172a;line-height:1.35}',
    '.score-bar{height:8px;background:#cbd5e1;border-radius:4px;margin:-6px 0 14px;overflow:hidden}',
    '.score-fill{height:100%;width:' + score + '%;background:' + accent + ';border-radius:4px}',
    '.threat{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:700;font-size:.85rem;color:#fff;background:' + threatFg + '}',
    '.hash{font-family:ui-monospace,monospace;font-size:.75rem;color:#475569;word-break:break-all}',
    '.footer{border-top:1px solid #cbd5e1;padding:14px 20px;font-size:.7rem;color:#64748b;text-align:center}',
    '</style></head><body>',
    '<article class="card" data-report-id="' + escapeHtml(payload.reportId) + '" data-variant="' + escapeHtml(payload.styleVariant) + '">',
    '<header class="header"><h1>Bureau of Acoustic Gasology</h1>',
    '<h2>' + escapeHtml(payload.fartName) + '</h2>',
    '<span class="badge">' + escapeHtml(payload.classification) + '</span></header>',
    '<section class="body">',
    field('Power Score', payload.powerScore + ' / 100'),
    '<div class="score-bar"><div class="score-fill"></div></div>',
    field('Duration', payload.durationMs + ' ms'),
    field('Emotional Tone', payload.emotionalTone),
    field('Probable Cause', payload.probableCause),
    field('Cinematic Parallel', payload.cinematicParallel),
    '<div class="row"><div class="label">Threat Level</div><div class="value"><span class="threat">' + threat + '</span></div></div>',
    '<div class="row"><div class="label">Fart Hash</div><div class="value hash">' + escapeHtml(payload.fartHash) + '</div></div>',
    '</section>',
    '<footer class="footer">' + escapeHtml(payload.watermark) + ' · ' + escapeHtml(payload.generatedAt) + '</footer>',
    '</article></body></html>',
  ].join('');

  return html;
}
