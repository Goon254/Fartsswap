/**
 * Hardcoded sample report shown in the hero preview card.
 *
 * Copy is intentionally specific. "Velvet Foghorn", "Late-night legume
 * symposium" etc. land as parody because they read like real classification
 * language — keep that tone if you replace them.
 */

export interface PreviewReport {
  classification: string;
  fartName: string;
  powerScore: number;
  durationMs: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: 'Green' | 'Amber' | 'Red' | 'Cerulean';
  confidenceLabel: 'Speculative' | 'Moderate' | 'High';
  reportHash: string;
  issuedAtIso: string;
  caseFile: string;
}

export const SAMPLE_REPORT: PreviewReport = {
  classification: 'Velvet Foghorn',
  fartName: 'The Midnight Bean',
  powerScore: 73,
  durationMs: 2410,
  emotionalTone: 'Wistful defiance',
  probableCause: 'Late-night legume symposium',
  cinematicParallel: 'A deleted scene from a Cold War submarine drama',
  threatLevel: 'Amber',
  confidenceLabel: 'Speculative',
  reportHash: 'fart_8c1d4a92b6e037f1',
  issuedAtIso: '2026-05-17T16:42:11Z',
  caseFile: 'BAG-2026-04412',
};

export const HERO_INFO_STRIP = [
  {
    label: 'NO LOGIN REQUIRED',
    detail: 'Anonymous session by default.',
  },
  {
    label: 'PRIVATE GENERATION, PUBLIC SHARING',
    detail: 'Raw audio never leaves the lab. Only the dossier travels.',
  },
  {
    label: 'VERTICAL EXPORT',
    detail: 'Pre-formatted for Stories, X, and TikTok.',
  },
] as const;

export const FEATURE_PANELS = [
  {
    numeral: 'I',
    label: 'ANALYZE',
    title: 'A 10-second sample is enough.',
    body: 'Record in-browser or submit a pre-captured clip. Audio is processed against the Bureau\u2019s acoustic-gas register. Raw material is sealed; only metadata graduates to the report stage.',
    spec: 'WAV / WEBM / OGG · 10s ceiling · client-side capture',
  },
  {
    numeral: 'II',
    label: 'CLASSIFY',
    title: 'FartGPT issues a serious diagnosis.',
    body: 'Twelve fields, all clinically unnecessary. Classification, power score, emotional undertone, cinematic parallel, methane advisory. The model is bound by a strict refuse-list — no medical claims, no profanity beyond mild parody.',
    spec: 'Structured JSON · brand-safety validated · server-controlled hash',
  },
  {
    numeral: 'III',
    label: 'SHARE',
    title: 'A dossier engineered for screenshots.',
    body: 'Export as a share card or a single-page PDF dossier. Each artifact carries a tamper-evident seal, an issued-on timestamp, and a Bureau case number. Friends will assume it is real for approximately four seconds.',
    spec: 'Share card · PDF · case number · institutional seal',
  },
] as const;

export const LORE_TERMS = [
  { term: 'FartGPT', detail: 'The model under the seal.' },
  { term: 'The Fart Vault', detail: 'A read-only register of historically significant emissions.' },
  { term: 'Methane Index', detail: 'A weekly market report of dominant classifications.' },
  { term: 'Fart Court', detail: 'Where classifications are contested by friends in good standing.' },
] as const;

export const NAVBAR_STATUS = {
  bureau: 'Bureau of Acoustic Gasology',
  station: 'STATION OPS-04',
  uptime: 'OPERATIONAL',
} as const;
