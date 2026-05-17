import { createHash } from 'crypto';

export interface FakeReportGenerationInput {
  customFartName?: string;
  tonePreset?: string;
  seed?: string;
}

export interface FakeReportFields {
  fartName: string;
  classification: string;
  powerScore: number;
  durationMs: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: string;
  fartHash: string;
}

const CLASSIFICATIONS = [
  'Silent Assassin',
  'Thunderclap 3000',
  'The Philosopher',
  'Gaslight Sonata',
  'Bean Incident',
  'Melancholy Jazz Fusion',
  'Bass Boosted Bureaucrat',
  'Velvet Foghorn',
] as const;

const EMOTIONAL_TONES = [
  'Wistful defiance',
  'Triumphant resignation',
  'Suspiciously optimistic',
  'Acoustically contrite',
  'Unlicensed confidence',
] as const;

const PROBABLE_CAUSES = [
  'Questionable chili diplomacy',
  'Late-night legume symposium',
  'Elevator silence pressure',
  'Aggressive meal prep',
  'Unfinished business with broccoli',
] as const;

const CINEMATIC_PARALLELS = [
  'The opening shot of a submarine thriller',
  'A deleted scene from a courtroom drama',
  'The third act of a heist film nobody funded',
  'A Werner Herzog narration over fog',
  'The Wilhelm scream, but tired',
] as const;

const THREAT_LEVELS = ['Green', 'Amber', 'Red', 'Cerulean'] as const;

const TONE_PRESET_MODIFIERS: Record<string, Partial<FakeReportFields>> = {
  clinical: {
    emotionalTone: 'Clinically unnecessary',
    threatLevel: 'Amber',
  },
  dramatic: {
    cinematicParallel: 'A slow-motion finale with wind machines',
    threatLevel: 'Red',
  },
  wholesome: {
    emotionalTone: 'Gently concerning',
    threatLevel: 'Green',
  },
};

function hashSeed(seed: string): number {
  const digest = createHash('sha256').update(seed).digest();
  return digest.readUInt32BE(0);
}

function pick<T>(items: readonly T[], index: number): T {
  // `index` may be negative because we use signed bit shifts on the seed
  // hash; guard against that so the modulo always lands in [0, length).
  const positive = ((index % items.length) + items.length) % items.length;
  return items[positive] as T;
}

export function generateFakeReportFields(input: FakeReportGenerationInput): FakeReportFields {
  const seed = input.seed ?? `${Date.now()}-${Math.random()}`;
  const base = hashSeed(seed);
  const trimmed = input.customFartName?.trim();
  const fartName = trimmed && trimmed.length > 0 ? trimmed : `Emission ${base % 9000 + 1000}`;
  const classification = pick(CLASSIFICATIONS, base);
  const powerScore = (base % 101);
  const durationMs = 800 + (base % 4200);
  const emotionalTone = pick(EMOTIONAL_TONES, base >> 4);
  const probableCause = pick(PROBABLE_CAUSES, base >> 8);
  const cinematicParallel = pick(CINEMATIC_PARALLELS, base >> 12);
  const threatLevel = pick(THREAT_LEVELS, base >> 16);

  const fields: FakeReportFields = {
    fartName,
    classification,
    powerScore,
    durationMs,
    emotionalTone,
    probableCause,
    cinematicParallel,
    threatLevel,
    fartHash: `fart_${createHash('sha256').update(seed).digest('hex').slice(0, 16)}`,
  };

  if (input.tonePreset && TONE_PRESET_MODIFIERS[input.tonePreset]) {
    return { ...fields, ...TONE_PRESET_MODIFIERS[input.tonePreset] };
  }

  return fields;
}
