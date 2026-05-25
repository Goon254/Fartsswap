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
  'Elevator descent with misplaced confidence',
  'A group chat that escalated emotionally before lunch',
  'Podcast about productivity listened at 2x speed',
  'Seat warmer left on high during a heat advisory',
  'Pre-interview power pose held three seconds too long',
  'Dog walked you instead of the reverse',
  'Complimentary airport lounge tuna melt, accepted without counsel',
  'Forgot you already had coffee and had more coffee',
  'True-crime documentary paired with unnamed crunchy snacks',
  'Yoga immediately after a bold lunch — statistically courageous',
  'Uber Eats driver judged the order in heroic silence',
  'Inherited casserole with no signed waiver',
  'Competitive cheese sampling at a farmer\'s market',
  'Nervous laughter during a eulogy-adjacent anecdote',
  'Trying to look athletic while picking up keys',
  'Video call muted but camera still judging posture',
  'Rain delay at a sporting event you did not attend',
  'Closet reorganisation that became emotional labour',
  'A 14:00 meeting that should have been an email',
  'Sleep schedule negotiated with a toddler and lost',
  'Thrift-store windbreaker worn indoors for confidence',
  'Escape room timer and a claustrophobic burrito timeline',
  'Influencer smoothie with ingredients spelled wrong on purpose',
  'Karaoke warmup for a song you do not know',
  'Garage sale negotiation over a lava lamp',
  'Wikipedia rabbit hole about submarines at 1am',
  'Parallel parking audience of three strangers',
  'Museum gift shop samples taken as a meal strategy',
  'Thermostat war with a roommate who loves winter',
  'Reply-all sent while emotionally compromised',
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
