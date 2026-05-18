import {
  classifyMovement,
  formatMovementDelta,
  rollThreatClimate,
  threatLabelFromRank,
  toRomanYear,
} from './ritual-math';

describe('ritual-math', () => {
  it('toRomanYear', () => {
    expect(toRomanYear(2026)).toBe('MMXXVI');
    expect(toRomanYear(2000)).toBe('MM');
  });

  it('classifyMovement', () => {
    expect(classifyMovement(0, 3)).toBe('new');
    expect(classifyMovement(100, 101)).toBe('flat');
    expect(classifyMovement(10, 20)).toBe('up');
    expect(classifyMovement(20, 10)).toBe('down');
  });

  it('formatMovementDelta', () => {
    expect(formatMovementDelta('new', 0, 2)).toBe('DEBUT');
    expect(formatMovementDelta('up', 10, 15)).toContain('+');
  });

  it('rollThreatClimate', () => {
    const r = rollThreatClimate({ Green: 80, Amber: 15, Red: 5, Cerulean: 0 });
    expect(r.band).toBe('green');
    expect(r.label).toContain('GREEN');
  });

  it('threatLabelFromRank', () => {
    expect(threatLabelFromRank(4)).toBe('Cerulean');
    expect(threatLabelFromRank(1)).toBe('Green');
  });
});
