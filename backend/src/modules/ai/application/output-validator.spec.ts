import {
  AiOutputParseError,
  buildFallbackFields,
  normaliseModelOutput,
  parseModelOutput,
} from './output-validator';
import type { AiReportRequest } from '../domain/ai-report.types';
import { ReportSource } from '../../../shared/domain/types';
import type { FakeReportFields } from '../../reports/domain/fake-report-generator';

const request: AiReportRequest = {
  source: ReportSource.FAKE,
  seed: 'seed-for-test',
};

const fallback: FakeReportFields = {
  fartName: 'Emission 1234',
  classification: 'Silent Assassin',
  powerScore: 50,
  durationMs: 1500,
  emotionalTone: 'Clinically unnecessary',
  probableCause: 'Late-night legume symposium',
  cinematicParallel: 'A deleted scene from a courtroom drama',
  threatLevel: 'Amber',
  fartHash: 'fart_unused_in_validator',
};

describe('parseModelOutput', () => {
  it('parses a clean JSON object', () => {
    const out = parseModelOutput('{"classification": "Velvet Foghorn", "powerScore": 70}');
    expect(out.classification).toBe('Velvet Foghorn');
    expect(out.powerScore).toBe(70);
  });

  it('parses JSON wrapped in ```json fences', () => {
    const text = '```json\n{"classification": "X"}\n```';
    expect(parseModelOutput(text).classification).toBe('X');
  });

  it('extracts the first balanced object from leading prose', () => {
    const text = 'Here is your report:\n{"classification": "Y", "shortSummary": "{nested: ok}"}\nThanks!';
    expect(parseModelOutput(text).classification).toBe('Y');
  });

  it('throws AiOutputParseError on non-JSON text', () => {
    expect(() => parseModelOutput('I will not comply.')).toThrow(AiOutputParseError);
    try {
      parseModelOutput('no json here');
    } catch (e) {
      expect((e as AiOutputParseError).reason).toBe('not_json');
    }
  });

  it('throws when the parsed value is an array, not an object', () => {
    expect(() => parseModelOutput('[1,2,3]')).toThrow(AiOutputParseError);
  });

  it('throws on schema-invalid shapes (wrong field types)', () => {
    expect(() => parseModelOutput('{"powerScore": "not a number"}')).toThrow(AiOutputParseError);
  });
});

describe('normaliseModelOutput', () => {
  it('maps a clean model output to fields and ALWAYS server-generates the hash', () => {
    const fields = normaliseModelOutput(
      {
        fartName: 'Velvet Decree',
        classification: 'The Philosopher',
        powerScore: 88,
        emotionalTone: 'Acoustically contrite',
        probableCause: 'Aggressive meal prep',
        cinematicParallel: 'A submarine thriller',
        threatLevel: 'red',
        shortSummary: 'A short summary.',
        reportHash: 'attacker_supplied_hash_should_be_ignored',
      },
      request,
      fallback,
    );
    expect(fields.fartName).toBe('Velvet Decree');
    expect(fields.threatLevel).toBe('Red'); // case-insensitive normalisation
    expect(fields.powerScore).toBe(88);
    expect(fields.reportHash).toMatch(/^fart_[a-f0-9]{16}$/);
    expect(fields.reportHash).not.toContain('attacker_supplied_hash');
  });

  it('falls back per-field for missing values', () => {
    const fields = normaliseModelOutput({}, request, fallback);
    expect(fields.fartName).toBe(fallback.fartName);
    expect(fields.classification).toBe(fallback.classification);
    expect(fields.powerScore).toBe(fallback.powerScore);
    expect(fields.threatLevel).toBe('Amber');
  });

  it('replaces disallowed-content fields with safe fallbacks', () => {
    const fields = normaliseModelOutput(
      {
        fartName: 'sexual content here',
        probableCause: 'covid diagnosis (medical)',
        emotionalTone: 'kill yourself',
      },
      request,
      fallback,
    );
    expect(fields.fartName).toBe(fallback.fartName);
    expect(fields.probableCause).toBe(fallback.probableCause);
    expect(fields.emotionalTone).toBe(fallback.emotionalTone);
  });

  it('clamps powerScore into 0..100', () => {
    expect(normaliseModelOutput({ powerScore: 999 }, request, fallback).powerScore).toBe(100);
    expect(normaliseModelOutput({ powerScore: -50 }, request, fallback).powerScore).toBe(0);
    expect(normaliseModelOutput({ powerScore: 73.4 }, request, fallback).powerScore).toBe(73);
  });

  it('truncates long strings to the field cap and trims trailing punctuation', () => {
    const long = 'a long sentence that just keeps going and going and going and going and going and going and going and going and going !!!.';
    const fields = normaliseModelOutput({ probableCause: long }, request, fallback);
    expect(fields.probableCause.length).toBeLessThanOrEqual(120);
    expect(fields.probableCause).not.toMatch(/[.!?,;:]$/);
  });

  it('normalises threatLevel against the closed set, falls back when unrecognised', () => {
    expect(normaliseModelOutput({ threatLevel: 'CERULEAN' }, request, fallback).threatLevel).toBe(
      'Cerulean',
    );
    expect(normaliseModelOutput({ threatLevel: 'spicy' }, request, fallback).threatLevel).toBe(
      'Amber',
    );
  });

  it('keeps optional fields only when valid + clean', () => {
    const fields = normaliseModelOutput(
      { genre: 'Diagnostic Funk', confidenceLabel: 'speculative', warningBadge: '   ' },
      request,
      fallback,
    );
    expect(fields.genre).toBe('Diagnostic Funk');
    expect(fields.confidenceLabel).toBe('Speculative');
    expect(fields.warningBadge).toBeUndefined();
  });

  it('uses request durationSeconds for the durationMs field on audio reports', () => {
    const fields = normaliseModelOutput(
      {},
      { ...request, source: ReportSource.AUDIO_RECORDING, durationSeconds: 3.7 },
      fallback,
    );
    expect(fields.durationMs).toBe(3700);
  });
});

describe('buildFallbackFields', () => {
  it('produces a complete fields object from the deterministic generator', () => {
    const fields = buildFallbackFields(request, fallback);
    expect(fields.fartName).toBe(fallback.fartName);
    expect(fields.threatLevel).toBe('Amber');
    expect(fields.shortSummary.length).toBeGreaterThan(0);
    expect(fields.reportHash).toMatch(/^fart_[a-f0-9]{16}$/);
  });

  it('respects durationSeconds when provided', () => {
    const fields = buildFallbackFields(
      { ...request, durationSeconds: 2.0 },
      fallback,
    );
    expect(fields.durationMs).toBe(2000);
  });
});
