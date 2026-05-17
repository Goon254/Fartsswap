import { generateFakeReportFields } from './fake-report-generator';

describe('generateFakeReportFields', () => {
  it('is deterministic for the same seed', () => {
    const a = generateFakeReportFields({ seed: 'fixed-seed', customFartName: 'Test' });
    const b = generateFakeReportFields({ seed: 'fixed-seed', customFartName: 'Test' });
    expect(a).toEqual(b);
  });

  it('uses custom fart name when provided', () => {
    const result = generateFakeReportFields({
      seed: 'x',
      customFartName: '  Bean Supreme  ',
    });
    expect(result.fartName).toBe('Bean Supreme');
  });

  it('applies tone preset modifiers', () => {
    const result = generateFakeReportFields({ seed: 'x', tonePreset: 'clinical' });
    expect(result.emotionalTone).toBe('Clinically unnecessary');
    expect(result.threatLevel).toBe('Amber');
  });

  it('produces bounded power score and hash prefix', () => {
    const result = generateFakeReportFields({ seed: 'score-test' });
    expect(result.powerScore).toBeGreaterThanOrEqual(0);
    expect(result.powerScore).toBeLessThanOrEqual(100);
    expect(result.fartHash).toMatch(/^fart_[a-f0-9]{16}$/);
  });
});
