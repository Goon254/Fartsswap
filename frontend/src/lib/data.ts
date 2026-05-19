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
    label: 'NO SIGNUP',
    detail: 'Anonymous session. No account required.',
  },
  {
    label: 'PRIVATE BY DEFAULT',
    detail: 'Replay your specimen on the dossier. Post to the feed only if you opt in.',
  },
  {
    label: 'CHALLENGE & FEED',
    detail: 'Send a challenge link. Rival records back. Public feed is moderated.',
  },
] as const;

export const FEATURE_PANELS = [
  {
    numeral: 'I',
    label: 'RECORD',
    title: 'Capture a real specimen in ten seconds.',
    body: 'Use your microphone in the browser. We store your clip, issue a funny AI dossier, and let you replay it privately on your report.',
    spec: 'LIVE AUDIO · WEBM / OGG · ~10s max · no signup',
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
    title: 'Challenge, replay, or opt into the feed.',
    body: 'Send a challenge link so your rival hears your fart and records a counter-specimen. Verdict compares scores. Post to the moderated public feed only when you choose.',
    spec: 'Challenge link · private replay · opt-in feed · share card',
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
