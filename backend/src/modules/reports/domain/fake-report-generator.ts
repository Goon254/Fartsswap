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
  'Bean Incident',
  'Revenge Takeout Tier',
  'Dairy Tribunal',
  'Midnight Refried Regret',
  'Velvet Foghorn',
] as const;

const EMOTIONAL_TONES = [
  'Defiantly unrepentant',
  'Suddenly aware of lunch',
  'Suspiciously dairy-forward',
  'Acoustically contrite',
  'Triumphant after questionable choices',
] as const;

const PROBABLE_CAUSES = [
  'Forensic conclusion: you ate something that fought back',
  'Last night\'s takeout filed a noise complaint',
  'Beans introduced without a permit',
  'The Bureau asks: what did you eat?',
  'Aggressive meal prep with legume intent',
  'Dairy entered the chat around 9pm',
] as const;

const CINEMATIC_PARALLELS = [
  'A food-documentary narrator losing composure',
  'The third act of a heist film nobody funded',
  'A submarine thriller with suspicious lunch',
  'A courtroom drama about portion control',
  'The Wilhelm scream, but after onion rings',
] as const;

const FUNNY_FART_NAMES = [
  'The Midnight Bean Verdict',
  'Operation Refried Regret',
  'The Dairy Tribunal',
  'Suspicious Chili Diplomacy',
  'The Elevator Incident',
  'The 3am Takeout Confession',
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
  const fartName =
    trimmed && trimmed.length > 0 ? trimmed : pick(FUNNY_FART_NAMES, base >> 2);
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
