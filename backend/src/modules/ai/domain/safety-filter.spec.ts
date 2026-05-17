import { containsDisallowedContent, sanitizeIntegerInRange, sanitizeString } from './safety-filter';

describe('sanitizeString', () => {
  const opts = { maxLength: 40, fallback: 'FALLBACK' };

  it('returns fallback for non-string input', () => {
    expect(sanitizeString(undefined, opts)).toBe('FALLBACK');
    expect(sanitizeString(123, opts)).toBe('FALLBACK');
    expect(sanitizeString({}, opts)).toBe('FALLBACK');
  });

  it('collapses whitespace and strips control characters', () => {
    expect(sanitizeString('hello  \tworld\u0000', opts)).toBe('hello world');
  });

  it('returns fallback for empty / whitespace-only input', () => {
    expect(sanitizeString('   ', opts)).toBe('FALLBACK');
    expect(sanitizeString('', opts)).toBe('FALLBACK');
  });

  it('returns fallback for any disallowed category', () => {
    expect(sanitizeString('sexy bean', opts)).toBe('FALLBACK');
    expect(sanitizeString('this is a slur using nigger', opts)).toBe('FALLBACK');
    expect(sanitizeString('medical diagnosis from FartGPT', opts)).toBe('FALLBACK');
    expect(sanitizeString('go kill yourself', opts)).toBe('FALLBACK');
    expect(sanitizeString('vomit-inducing', opts)).toBe('FALLBACK');
  });

  it('truncates and trims trailing punctuation cleanly', () => {
    const long = 'A clean sentence that runs slightly past the cap, with stuff!';
    const out = sanitizeString(long, { maxLength: 30, fallback: 'X' });
    expect(out.length).toBeLessThanOrEqual(30);
    expect(out).not.toMatch(/[.!?,;:\s-]+$/);
  });

  it('leaves clean short strings unchanged', () => {
    expect(sanitizeString('Velvet Foghorn', opts)).toBe('Velvet Foghorn');
  });
});

describe('sanitizeIntegerInRange', () => {
  const range = { min: 0, max: 100, fallback: 50 };

  it('rounds and clamps numbers', () => {
    expect(sanitizeIntegerInRange(73.4, range)).toBe(73);
    expect(sanitizeIntegerInRange(-10, range)).toBe(0);
    expect(sanitizeIntegerInRange(9999, range)).toBe(100);
  });

  it('falls back on non-numeric / non-finite input', () => {
    expect(sanitizeIntegerInRange('seven', range)).toBe(50);
    expect(sanitizeIntegerInRange(NaN, range)).toBe(50);
    expect(sanitizeIntegerInRange(Infinity, range)).toBe(50);
  });
});

describe('containsDisallowedContent', () => {
  it('catches the brand-critical categories', () => {
    expect(containsDisallowedContent('sexy classification')).toBe(true);
    expect(containsDisallowedContent('medical advice please')).toBe(true);
    expect(containsDisallowedContent('SHOOT UP the place')).toBe(true);
  });

  it('lets clean parody language through', () => {
    expect(containsDisallowedContent('Velvet Foghorn in B minor')).toBe(false);
    expect(containsDisallowedContent('A deleted scene from a courtroom drama')).toBe(false);
  });
});
