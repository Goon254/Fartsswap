import {
  DEFAULT_PDF_THEME_CODE,
  getPdfTheme,
  listPdfThemes,
  PDF_THEME_CODES,
  resolvePdfThemeCode,
} from './pdf-themes';

describe('pdf themes registry', () => {
  it('exposes the default theme code', () => {
    expect(DEFAULT_PDF_THEME_CODE).toBe('default');
    expect(PDF_THEME_CODES).toContain('default');
  });

  it('includes the documented premium tier entries', () => {
    expect(PDF_THEME_CODES).toEqual(
      expect.arrayContaining(['default', 'clinical_gold', 'courtroom', 'space_agency']),
    );
    const premium = listPdfThemes().filter((t) => t.tier === 'premium');
    expect(premium.map((t) => t.code)).toEqual(
      expect.arrayContaining(['clinical_gold', 'courtroom', 'space_agency']),
    );
  });

  it('returns the requested theme by code (case-insensitive)', () => {
    expect(getPdfTheme('clinical_gold').code).toBe('clinical_gold');
    expect(getPdfTheme('CLINICAL_GOLD').code).toBe('clinical_gold');
    expect(getPdfTheme('  default  ').code).toBe('default');
  });

  it('falls back to the default theme for unknown codes', () => {
    expect(getPdfTheme('does_not_exist').code).toBe(DEFAULT_PDF_THEME_CODE);
    expect(getPdfTheme(undefined).code).toBe(DEFAULT_PDF_THEME_CODE);
    expect(getPdfTheme(null).code).toBe(DEFAULT_PDF_THEME_CODE);
  });

  it('resolvePdfThemeCode coerces invalid input to default', () => {
    expect(resolvePdfThemeCode('default')).toBe('default');
    expect(resolvePdfThemeCode('CLINICAL_GOLD')).toBe('clinical_gold');
    expect(resolvePdfThemeCode('not_a_theme')).toBe('default');
    expect(resolvePdfThemeCode(undefined)).toBe('default');
    expect(resolvePdfThemeCode(null)).toBe('default');
  });
});
