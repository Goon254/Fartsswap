export type Movement = 'up' | 'down' | 'flat' | 'volatile' | 'new';

const ROMAN: readonly [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRomanYear(year: number): string {
  if (!Number.isFinite(year) || year < 1 || year > 3999) return String(year);
  let n = Math.floor(year);
  let out = '';
  for (const [value, sym] of ROMAN) {
    while (n >= value) {
      out += sym;
      n -= value;
    }
  }
  return out;
}

/** ISO-8601 week number and the ISO week-year (Thursday rule). */
export function isoWeekParts(d: Date): { isoYear: number; isoWeek: number } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const isoYear = t.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { isoYear, isoWeek: weekNo };
}

export function classifyMovement(prevCount: number, currCount: number): Movement {
  if (prevCount === 0 && currCount > 0) return 'new';
  if (prevCount === 0 && currCount === 0) return 'flat';
  const change = ((currCount - prevCount) / Math.max(prevCount, 1)) * 100;
  if (Math.abs(change) < 4) return 'flat';
  if (Math.abs(change) < 12 && currCount > 0 && prevCount > 0) return 'volatile';
  if (change > 0) return 'up';
  return 'down';
}

export function formatMovementDelta(movement: Movement, prevCount: number, currCount: number): string {
  if (movement === 'new') return 'DEBUT';
  if (prevCount === 0) return '—';
  if (movement === 'flat') return '±0%';
  const pct = Math.round(((currCount - prevCount) / Math.max(prevCount, 1)) * 1000) / 10;
  const s = `${Math.abs(pct).toFixed(1)}%`;
  if (movement === 'volatile') return `±${s}`;
  if (movement === 'up') return `+${s}`;
  return `\u2212${s}`;
}

export function threatRankFromLabel(threat: string): number {
  switch (threat) {
    case 'Cerulean':
      return 4;
    case 'Red':
      return 3;
    case 'Amber':
      return 2;
    case 'Green':
      return 1;
    default:
      return 0;
  }
}

export function threatLabelFromRank(rank: number): 'Green' | 'Amber' | 'Red' | 'Cerulean' {
  if (rank >= 4) return 'Cerulean';
  if (rank >= 3) return 'Red';
  if (rank >= 2) return 'Amber';
  return 'Green';
}

export function severityFromThreatLabel(threat: string): 'green' | 'amber' | 'red' | 'cerulean' {
  switch (threat) {
    case 'Cerulean':
      return 'cerulean';
    case 'Red':
      return 'red';
    case 'Amber':
      return 'amber';
    default:
      return 'green';
  }
}

/** Aggregate threat climate from report counts per threat label. */
export function rollThreatClimate(counts: Record<string, number>): {
  band: 'green' | 'amber' | 'red' | 'cerulean';
  label: string;
} {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { band: 'amber', label: 'AMBER · PROVISIONAL' };
  }
  const cer = (counts.Cerulean ?? 0) / total;
  const red = (counts.Red ?? 0) / total;
  const amb = (counts.Amber ?? 0) / total;
  if (cer >= 0.08) return { band: 'cerulean', label: 'CERULEAN · ANOMALOUS' };
  if (red >= 0.22) return { band: 'red', label: 'RED · ACUTE' };
  if (amb + red >= 0.45) return { band: 'amber', label: 'AMBER · ELEVATED' };
  if (amb >= 0.35) return { band: 'amber', label: 'AMBER · WATCH' };
  return { band: 'green', label: 'GREEN · ROUTINE' };
}

export function clampPercentile(p: number): number {
  if (!Number.isFinite(p)) return 50;
  return Math.min(99, Math.max(1, Math.round(p)));
}
