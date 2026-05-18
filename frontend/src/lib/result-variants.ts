/**
 * Hardcoded mock result variants used by the /report route.
 *
 * This module is the canonical source for "what does a typical Bureau report
 * look like" while the backend integration is still pending. Every variant
 * carries its own captions, waveform seed, threat level, and a fully written
 * dossier — there is no lorem ipsum in this file on purpose. We want to be
 * able to A/B these in screenshots and pick winners by reading them.
 *
 * Add new variants by appending to RESULT_VARIANTS. Keep `id` snake_case and
 * unique; the URL-less switcher uses it as the React key.
 */

export type ThreatLevel = 'Green' | 'Amber' | 'Red' | 'Cerulean';
export type ConfidenceLabel = 'Low' | 'Moderate' | 'High' | 'Speculative';

export interface ResultVariant {
  id: string;
  /** Short code shown in the variant switcher pill. */
  switcherCode: string;

  // — Primary fields —
  classification: string;
  subjectTitle: string;
  powerScore: number;
  durationMs: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: ThreatLevel;
  confidenceLabel: ConfidenceLabel;
  reportHash: string;
  caseFile: string;
  issuedAtIso: string;

  // — Optional flair —
  genre?: string;
  warningBadge?: string;

  // — Diagnostic flavour —
  /** One-line dossier summary, sits under the classification headline. */
  shortSummary: string;
  /** Deterministic seed for the waveform shape (so each variant looks distinct). */
  waveformSeed: number;

  // — Brand captions, 5 per variant —
  captions: readonly string[];
}

export const RESULT_VARIANTS: readonly ResultVariant[] = [
  {
    id: 'silent_assassin',
    switcherCode: 'I · SILENT',
    classification: 'Silent Assassin',
    subjectTitle: 'The Midnight Bean',
    powerScore: 42,
    durationMs: 920,
    emotionalTone: 'Calculated restraint',
    probableCause: 'Diplomatic legume negotiations in low-light conditions',
    cinematicParallel: 'A surveillance scene shot through frosted glass',
    threatLevel: 'Green',
    confidenceLabel: 'High',
    reportHash: 'fart_9a2c81e07d4b6f33',
    caseFile: 'BAG-2026-04412',
    issuedAtIso: '2026-05-17T16:42:11Z',
    genre: 'Subsonic Ambient',
    warningBadge: 'STEALTH GRADE',
    shortSummary:
      'A measured emission of theatrical restraint. The Bureau notes deliberate volume control and absence of witnesses.',
    waveformSeed: 42,
    captions: [
      'I regret to inform you that my fart has been clinically classified.',
      'Silent Assassin. No witnesses. Report sealed.',
      'FartGPT confirms: nobody heard a thing. Threat Level Green.',
      'I have been declared a stealth-class emission asset.',
      'My fart was returned with the note: "Discretion exemplary."',
    ],
  },
  {
    id: 'melancholy_jazz_fusion',
    switcherCode: 'II · MELANCHOLY',
    classification: 'Melancholy Jazz Fusion',
    subjectTitle: 'Saxophone, Empty Bar',
    powerScore: 58,
    durationMs: 3270,
    emotionalTone: 'Wistful defiance',
    probableCause: 'A 1am playlist of recordings that should have ended careers',
    cinematicParallel: 'A long take from a film festival nobody attended',
    threatLevel: 'Amber',
    confidenceLabel: 'Speculative',
    reportHash: 'fart_b13e6042fa1c89d4',
    caseFile: 'BAG-2026-04413',
    issuedAtIso: '2026-05-17T02:11:48Z',
    genre: 'Diagnostic Bebop',
    warningBadge: 'EMOTIONALLY COMPLEX',
    shortSummary:
      'A long-form emission with discernible arc. The Bureau detected vibrato and a sense of regret.',
    waveformSeed: 217,
    captions: [
      'The Bureau has classified my emission as Melancholy Jazz Fusion.',
      'Apparently I am giving \u201Ca deleted scene from a Wong Kar-wai film.\u201D',
      'FartGPT says this one was emotionally complex.',
      'Cinematic parallel: a saxophone solo in an empty bar.',
      'Threat Level Amber. Genre confirmed. Sleep will be difficult.',
    ],
  },
  {
    id: 'conference_room_incident',
    switcherCode: 'III · CONFERENCE',
    classification: 'Conference Room Incident',
    subjectTitle: 'Q3 All-Hands, 14:00',
    powerScore: 87,
    durationMs: 1450,
    emotionalTone: 'Professionally devastating',
    probableCause: 'A pre-meeting burrito and unforgiving seating geometry',
    cinematicParallel: 'A boardroom drama where someone\u2019s career ends in act two',
    threatLevel: 'Red',
    confidenceLabel: 'High',
    reportHash: 'fart_4d09e2317cf5a0b8',
    caseFile: 'BAG-2026-04414',
    issuedAtIso: '2026-05-17T14:02:33Z',
    genre: 'Corporate Punk',
    warningBadge: 'CALENDARS AFFECTED',
    shortSummary:
      'A high-intensity emission recorded inside a glassed enclosure. Bureau recommends a 24-hour cooling-off period before the next meeting.',
    waveformSeed: 901,
    captions: [
      'I have been issued a Conference Room Incident classification.',
      'An official advisory has been filed. HR is reviewing.',
      'Threat Level Red. Calendars rescheduled.',
      'Probable cause: a 14:00 meeting.',
      'The Bureau\u2019s recommendation: take the rest of the afternoon.',
    ],
  },
  {
    id: 'the_philosopher',
    switcherCode: 'IV · PHILOSOPHER',
    classification: 'The Philosopher',
    subjectTitle: 'A Question Without Answer',
    powerScore: 33,
    durationMs: 4180,
    emotionalTone: 'Patient and rhetorical',
    probableCause: 'A small library and a smaller espresso',
    cinematicParallel: 'A monologue delivered to a window, slowly, in three acts',
    threatLevel: 'Cerulean',
    confidenceLabel: 'Speculative',
    reportHash: 'fart_72b81f4ac6309e15',
    caseFile: 'BAG-2026-04415',
    issuedAtIso: '2026-05-17T11:18:02Z',
    genre: 'Contemplative Drone',
    warningBadge: 'INTELLECTUALLY ACTIVE',
    shortSummary:
      'A drawn-out emission with a clear interrogative shape. The Bureau is still considering the question it appears to be asking.',
    waveformSeed: 314,
    captions: [
      'FartGPT has declared this emission philosophically significant.',
      'I am told my fart \u201Casked a question rather than offered an answer.\u201D',
      'Classification: The Philosopher. Threat Level Cerulean.',
      'Even the Bureau is contemplating it.',
      'The report ends with: \u201CFurther reading recommended.\u201D',
    ],
  },
  {
    id: 'cerulean_event',
    switcherCode: 'V · CERULEAN',
    classification: 'Cerulean Event',
    subjectTitle: 'Station Anomaly OPS-04',
    powerScore: 96,
    durationMs: 2010,
    emotionalTone: 'Quietly historic',
    probableCause: 'Conditions the Bureau is not yet at liberty to disclose',
    cinematicParallel: 'A weather satellite catching something it shouldn\u2019t have',
    threatLevel: 'Cerulean',
    confidenceLabel: 'Moderate',
    reportHash: 'fart_0c5d4ae2b178f963',
    caseFile: 'BAG-2026-04416',
    issuedAtIso: '2026-05-17T19:55:01Z',
    genre: 'Rare Classification',
    warningBadge: 'METHANE INDEX UPDATED',
    shortSummary:
      'An emission of unusual register. Filed under the Bureau\u2019s rare-event protocol; the Methane Index has been adjusted accordingly.',
    waveformSeed: 1881,
    captions: [
      'A Cerulean Event has been recorded under my name.',
      'Bureau confirms: rare classification. Frame this one.',
      'Threat Level Cerulean. The Methane Index has been updated.',
      'I have made history at Station OPS-04.',
      'FartGPT noted, on the record, that \u201Cthis one is for the archive.\u201D',
    ],
  },
  {
    id: 'gaslight_sonata',
    switcherCode: 'VI · GASLIGHT',
    classification: 'Gaslight Sonata',
    subjectTitle: 'Three Movements, One Room',
    powerScore: 71,
    durationMs: 3540,
    emotionalTone: 'Operatic in scope',
    probableCause: 'An ambitious dinner and a louder opinion',
    cinematicParallel: 'A third-act crescendo nobody asked for',
    threatLevel: 'Amber',
    confidenceLabel: 'High',
    reportHash: 'fart_5e9b7f130c248ad6',
    caseFile: 'BAG-2026-04417',
    issuedAtIso: '2026-05-17T21:09:44Z',
    genre: 'Chamber Opera',
    warningBadge: 'STANDING OVATION WITHHELD',
    shortSummary:
      'A multi-movement emission with discernible structure. The Bureau commends the ambition; the audience did not.',
    waveformSeed: 555,
    captions: [
      'Classified as Gaslight Sonata. The Bureau is asking questions.',
      'Apparently my fart was \u201Coperatic in scope.\u201D',
      'FartGPT says this performance demanded a third act.',
      'Threat Level Amber. Standing ovation withheld.',
      'The closing remark on the dossier: \u201CDoor was open. Door is now closed.\u201D',
    ],
  },
  {
    id: 'bass_boosted_bureaucrat',
    switcherCode: 'VII · BASS',
    classification: 'Bass Boosted Bureaucrat',
    subjectTitle: 'Memo, in F-Sharp',
    powerScore: 93,
    durationMs: 1820,
    emotionalTone: 'Authoritative and unrepentant',
    probableCause: 'A 4pm departmental announcement',
    cinematicParallel: 'A film score cue mistaken for a building alarm',
    threatLevel: 'Red',
    confidenceLabel: 'High',
    reportHash: 'fart_2f6010c4ae831b75',
    caseFile: 'BAG-2026-04418',
    issuedAtIso: '2026-05-17T16:04:09Z',
    genre: 'Civic Bass',
    warningBadge: 'STRUCTURAL REVIEW',
    shortSummary:
      'A formally announced emission of considerable low-end. Recorded with the windows in disagreement.',
    waveformSeed: 7777,
    captions: [
      'Classification: Bass Boosted Bureaucrat. Reports were filed.',
      'Threat Level Red. The neighbours have been informed.',
      'FartGPT did not flinch. The walls did.',
      'Bureau memo: this one required structural review.',
      'I have been added to the building\u2019s acoustic register.',
    ],
  },
  {
    id: 'velvet_foghorn',
    switcherCode: 'VIII · VELVET',
    classification: 'Velvet Foghorn',
    subjectTitle: 'Tactile, Reluctant, Honest',
    powerScore: 73,
    durationMs: 2410,
    emotionalTone: 'Refined honesty',
    probableCause: 'A late-night legume symposium and excellent posture',
    cinematicParallel: 'A foghorn rendered in upholstery',
    threatLevel: 'Amber',
    confidenceLabel: 'Speculative',
    reportHash: 'fart_8c1d4a92b6e037f1',
    caseFile: 'BAG-2026-04419',
    issuedAtIso: '2026-05-17T22:14:55Z',
    genre: 'Tactile Lounge',
    warningBadge: 'TEXTURED EMISSION',
    shortSummary:
      'An emission of notable surface quality. The Bureau records a discernible weave and recommends a second listening.',
    waveformSeed: 4242,
    captions: [
      'I have been issued a Velvet Foghorn classification.',
      'Apparently the texture was \u201Ctactile.\u201D',
      'Threat Level Amber. Confidence: Speculative.',
      'FartGPT recommends a second listening.',
      'The dossier concludes: \u201CWell-upholstered. Filed.\u201D',
    ],
  },
];

export function getVariant(id: string): ResultVariant {
  return RESULT_VARIANTS.find((v) => v.id === id) ?? RESULT_VARIANTS[0]!;
}

/** Alias used by the analyze flow for symmetry with `getRandomVariant`. */
export function getVariantById(id: string | null | undefined): ResultVariant {
  if (!id) return RESULT_VARIANTS[0]!;
  return getVariant(id);
}

/**
 * Pick a pseudo-random variant.
 *
 * Used by the analyze flow when the user chooses "Generate a Fake One" or
 * finishes a simulated capture and we need to land on *some* dossier. We bias
 * very slightly toward variants that tend to screenshot well so most of our
 * mockup runs surface the strongest copy — Cerulean Event is intentionally
 * downweighted because it's the "rare" classification and shouldn't appear
 * every third roll.
 */
export function getRandomVariant(excludeId?: string | null): ResultVariant {
  const WEIGHTS: Record<string, number> = {
    silent_assassin: 3,
    melancholy_jazz_fusion: 3,
    conference_room_incident: 3,
    the_philosopher: 2,
    cerulean_event: 1,
    gaslight_sonata: 3,
    bass_boosted_bureaucrat: 2,
    velvet_foghorn: 3,
  };
  const pool = RESULT_VARIANTS.filter((v) => v.id !== excludeId);
  const total = pool.reduce((sum, v) => sum + (WEIGHTS[v.id] ?? 1), 0);
  let roll = Math.random() * total;
  for (const v of pool) {
    roll -= WEIGHTS[v.id] ?? 1;
    if (roll <= 0) return v;
  }
  return pool[0] ?? RESULT_VARIANTS[0]!;
}
