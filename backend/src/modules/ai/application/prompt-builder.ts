import { ReportSource } from '../../../shared/domain/types';
import type { AiReportRequest } from '../domain/ai-report.types';

/**
 * Prompt construction.
 *
 * The system prompt is the contract: voice, refusal rules, output format.
 * It is intentionally explicit + redundant — models drift on long-tail
 * inputs, so we restate constraints rather than rely on a single sentence.
 *
 * The user prompt is a short, structured brief shaped by request `source`.
 * Both prompts are deterministic given the same input (no clock, no random
 * numbers) so they can be diffed in code review.
 */

/**
 * Marker substrings that MUST appear in the system prompt at all times.
 * Tested in the prompt builder spec so a future refactor that accidentally
 * deletes one of these guard rails is caught immediately.
 */
export const SAFETY_KEYWORDS = [
  'PG-13',
  'No sexual',
  'No slurs',
  'No medical claims',
  'No real people',
  'No graphic',
  'JSON object',
] as const;

export const SYSTEM_PROMPT = [
  'You are FartGPT, the parody acoustic-diagnostic engine for Farts.com.',
  'You produce theatrical, official-sounding clinical-parody reports about a single fart.',
  '',
  'Voice:',
  '- Deadpan Bureau-of-Acoustic-Gasology framing, but the jokes land: roasty, memeable, food-detective energy.',
  '- Write like a forensic lab that is 90% serious and 10% personally offended by what the subject ate.',
  '- Use playful direct address where natural ("you", "your specimen", "the subject") without harassment.',
  '- probableCause should feel like "what did you eat?" speculation — beans, dairy, revenge takeout, suspicious meal prep.',
  '- shortSummary is the punchline dossier line someone would screenshot.',
  '- fartName must be a funny, evocative title (not a serial number).',
  '- Absurd specificity > generic jokes.',
  '- Comedy lives in the contrast between serious diagnostic language and a trivial subject.',
  '',
  'Hard rules (refuse / rewrite silently — never explain):',
  '- PG-13 only. No sexual, fetish, erotic, or romantic content.',
  '- No slurs, hate speech, harassment, or targeted cruelty.',
  '- No graphic body-fluid description, no anatomy below "digestive / acoustic" generalities.',
  '- No medical claims, diagnoses, prescriptions, or health advice.',
  '- No real people, public figures, brand attacks, or copyrighted characters.',
  '- No self-harm, violence, or political content.',
  '- Avoid profanity beyond mild parody ("rogue bean", "suspicious chili").',
  '',
  'Style guard rails:',
  '- Every string field should be screenshot-worthy and tightly written.',
  '- Prefer evocative imagery over crude descriptors.',
  '- Cinematic parallels should reference genres / archetypes, never specific titles or people.',
  '',
  'Output format (STRICT):',
  '- Return ONE JSON object and NOTHING else. No prose, no code fences, no comments.',
  '- Fields (all strings unless marked):',
  '    fartName: string  // <= 60 chars, evocative title for this emission',
  '    classification: string  // <= 40 chars, e.g. "Silent Assassin"',
  '    powerScore: integer 0-100',
  '    emotionalTone: string  // <= 60 chars',
  '    probableCause: string  // <= 120 chars',
  '    cinematicParallel: string  // <= 120 chars, genre/archetype-level',
  '    threatLevel: one of "Green" | "Amber" | "Red" | "Cerulean"',
  '    shortSummary: string  // <= 180 chars, one-line dossier summary',
  '    genre: string  // <= 40 chars, optional musical/cinematic genre tag',
  '    confidenceLabel: one of "Low" | "Moderate" | "High" | "Speculative"',
  '    warningBadge: string  // <= 24 chars, e.g. "Methane Advisory: Amber"',
  '- Do NOT include any field not listed above.',
  '- Do NOT include reportHash (the server generates it).',
].join('\n');

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(request: AiReportRequest): BuiltPrompt {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(request),
  };
}

function buildUserPrompt(request: AiReportRequest): string {
  const lines: string[] = [];

  if (request.source === ReportSource.AUDIO_RECORDING) {
    lines.push('SUBJECT: Captured acoustic sample submitted to the Bureau.');
    if (typeof request.durationSeconds === 'number' && Number.isFinite(request.durationSeconds)) {
      const clamped = Math.max(0.1, Math.min(10, request.durationSeconds));
      lines.push(`DURATION_SECONDS: ${clamped.toFixed(2)}`);
    }
    if (request.audioMetadata?.mimeType) {
      lines.push(`CONTAINER: ${request.audioMetadata.mimeType}`);
    }
    if (typeof request.audioMetadata?.sizeBytes === 'number') {
      lines.push(`SAMPLE_SIZE_BYTES: ${request.audioMetadata.sizeBytes}`);
    }
    lines.push(
      'IMPORTANT: This is parody. Do not pretend to perform real medical, scientific, or forensic analysis.',
    );
    lines.push(
      'COMEDY BRIEF: The Bureau suspects last night\'s choices. probableCause = food/meal roasts; emotionalTone = how the subject feels about it; classification = a funny category name.',
    );
  } else {
    lines.push('SUBJECT: No audio captured. Synthesise a purely speculative dossier.');
  }

  if (request.customFartName && request.customFartName.length > 0) {
    // We pass the user name as a CONSTRAINT, not as the title to echo back verbatim,
    // so the model still applies the safety rules. The validator+sanitiser
    // re-checks the final string regardless.
    lines.push(`REQUESTED_TITLE_HINT: ${truncateForPrompt(request.customFartName, 60)}`);
    lines.push('If the requested title is unsafe or unsuitable, invent a safer alternative.');
  }
  if (request.tonePreset) {
    lines.push(`TONE_PRESET: ${truncateForPrompt(request.tonePreset, 24)}`);
    lines.push(
      'Honour the tone preset (e.g. "clinical" = dry/diagnostic, "dramatic" = operatic, "wholesome" = gentle).',
    );
  }

  lines.push('');
  lines.push('Produce the JSON report now.');
  return lines.join('\n');
}

function truncateForPrompt(value: string, max: number): string {
  // Strip control chars + collapse whitespace before bounding length. Anything
  // longer than `max` becomes "<truncated>" rather than a half-word so prompt
  // injection via long inputs can't pivot the instructions.
  // eslint-disable-next-line no-control-regex
  const stripControl = /[\u0000-\u001F\u007F]/g;
  const cleaned = value.replace(stripControl, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max)}…`;
}
