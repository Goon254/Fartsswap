/**
 * Theme registry for PDF diagnostic reports.
 *
 * Themes are pure visual presets. Selecting any of them is **free** in Phase 7
 * — the data model is in place so entitlements/payments can gate the
 * `tier === 'premium'` ones in a later phase without changing the API.
 *
 * Codes are stable strings (snake_case), stored verbatim in
 * `report_artifacts.theme_code`. The `displayName` is what shows on the PDF
 * header so designers can rename without a DB migration.
 */

export interface PdfTheme {
  code: string;
  displayName: string;
  tier: 'free' | 'premium';
  /** Solid colour for the header band + accent strokes. Hex without alpha. */
  accent: string;
  /** Foreground colour for header text. */
  accentText: string;
  /** Paper / canvas tint. White (#FFFFFF) for the default. */
  paper: string;
  /** Body text colour. */
  body: string;
  /** Muted colour used for labels + footer. */
  muted: string;
  /** Threat-level pill colour mapping (defaults to the accent if not set). */
  threatRing: string;
}

export const DEFAULT_PDF_THEME_CODE = 'default';

const REGISTRY: Record<string, PdfTheme> = {
  default: {
    code: 'default',
    displayName: 'Standard Issue',
    tier: 'free',
    accent: '#0F172A',
    accentText: '#FFFFFF',
    paper: '#FFFFFF',
    body: '#0F172A',
    muted: '#64748B',
    threatRing: '#0EA5E9',
  },
  clinical_gold: {
    code: 'clinical_gold',
    displayName: 'Clinical Gold (Premium)',
    tier: 'premium',
    accent: '#0B1320',
    accentText: '#F5C264',
    paper: '#FAF8F2',
    body: '#1F2937',
    muted: '#7A6A3F',
    threatRing: '#F5C264',
  },
  courtroom: {
    code: 'courtroom',
    displayName: 'Courtroom (Premium)',
    tier: 'premium',
    accent: '#5B1018',
    accentText: '#F6E6C8',
    paper: '#FAF3E7',
    body: '#2A1A0F',
    muted: '#7A5333',
    threatRing: '#5B1018',
  },
  space_agency: {
    code: 'space_agency',
    displayName: 'Space Agency (Premium)',
    tier: 'premium',
    accent: '#020617',
    accentText: '#22D3EE',
    paper: '#F8FAFC',
    body: '#0F172A',
    muted: '#475569',
    threatRing: '#22D3EE',
  },
  black_file: {
    code: 'black_file',
    displayName: 'Clinical Black File (Premium)',
    tier: 'premium',
    accent: '#020617',
    accentText: '#E2E8F0',
    paper: '#F1F5F9',
    body: '#0F172A',
    muted: '#64748B',
    threatRing: '#94A3B8',
  },
  executive_gold: {
    code: 'executive_gold',
    displayName: 'Gold Seal Executive (Premium)',
    tier: 'premium',
    accent: '#1C1917',
    accentText: '#FBBF24',
    paper: '#FFFBEB',
    body: '#292524',
    muted: '#78716C',
    threatRing: '#FBBF24',
  },
  luxury_lab: {
    code: 'luxury_lab',
    displayName: 'Luxury Lab Edition (Premium)',
    tier: 'premium',
    accent: '#0C4A6E',
    accentText: '#E0F2FE',
    paper: '#F8FAFC',
    body: '#0F172A',
    muted: '#0369A1',
    threatRing: '#38BDF8',
  },
  roast_mode: {
    code: 'roast_mode',
    displayName: 'Roast Mode Certificate (Premium)',
    tier: 'premium',
    accent: '#7F1D1D',
    accentText: '#FEE2E2',
    paper: '#FFF7ED',
    body: '#431407',
    muted: '#9A3412',
    threatRing: '#F97316',
  },
  party_pack: {
    code: 'party_pack',
    displayName: 'Roommate / Party Pack (Premium)',
    tier: 'premium',
    accent: '#4C1D95',
    accentText: '#F5D0FE',
    paper: '#FDF4FF',
    body: '#3B0764',
    muted: '#86198F',
    threatRing: '#E879F9',
  },
};

export const PDF_THEME_CODES = Object.keys(REGISTRY);

/**
 * Static fallback theme — kept out of the optional-lookup path so we can
 * always return a `PdfTheme` reference without a non-null assertion.
 */
const FALLBACK_THEME: PdfTheme = {
  code: 'default',
  displayName: 'Standard Issue',
  tier: 'free',
  accent: '#0F172A',
  accentText: '#FFFFFF',
  paper: '#FFFFFF',
  body: '#0F172A',
  muted: '#64748B',
  threatRing: '#0EA5E9',
};

export function getPdfTheme(code: string | undefined | null): PdfTheme {
  if (typeof code !== 'string') return FALLBACK_THEME;
  const normalised = code.trim().toLowerCase();
  return REGISTRY[normalised] ?? FALLBACK_THEME;
}

/**
 * Coerce an arbitrary client-supplied theme code into a valid registry entry.
 * Returns `DEFAULT_PDF_THEME_CODE` for anything we don't recognise so the
 * endpoint never 400s on theme alone.
 */
export function resolvePdfThemeCode(code: string | undefined | null): string {
  if (typeof code !== 'string') return DEFAULT_PDF_THEME_CODE;
  const normalised = code.trim().toLowerCase();
  return REGISTRY[normalised] ? normalised : DEFAULT_PDF_THEME_CODE;
}

export function listPdfThemes(): readonly PdfTheme[] {
  return Object.values(REGISTRY);
}
