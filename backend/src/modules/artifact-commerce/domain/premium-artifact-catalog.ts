/**
 * Sellable premium report themes — commerce catalog (not the PDF renderer registry).
 * Each entry maps to a `pdf-themes` code for certificate / dossier PDF generation.
 */

export const PREMIUM_ARTIFACT_THEME_CODES = [
  'clinical_black_file',
  'gold_seal_executive',
  'courtroom_dossier',
  'luxury_lab_edition',
  'roast_mode_certificate',
  'roommate_party_pack',
] as const;

export type PremiumArtifactThemeCode = (typeof PREMIUM_ARTIFACT_THEME_CODES)[number];

export interface PremiumArtifactTheme {
  readonly code: PremiumArtifactThemeCode;
  readonly displayName: string;
  readonly description: string;
  /** PDF renderer theme (`pdf-themes.ts`). */
  readonly pdfThemeCode: string;
  /** Hint for which free dossier skins pair well (report `variant_id` / client catalog). */
  readonly suggestedReportVariantIds: readonly string[];
  readonly priceCents: number;
  readonly currency: 'USD';
  readonly available: boolean;
  readonly productSkus: {
    readonly themeUpgrade: string;
    readonly officialPdf: string;
    readonly wallPrint: string;
    readonly merchBundle: string;
  };
}

export const PREMIUM_ARTIFACT_THEMES: readonly PremiumArtifactTheme[] = [
  {
    code: 'clinical_black_file',
    displayName: 'Clinical Black File',
    description: 'Matte black header band, brass microtype, “restricted circulation” energy.',
    pdfThemeCode: 'black_file',
    suggestedReportVariantIds: ['silent_assassin', 'conference_room_incident'],
    priceCents: 799,
    currency: 'USD',
    available: true,
    productSkus: {
      themeUpgrade: 'theme_clinical_black_file',
      officialPdf: 'cert_official_pdf_clinical_black_file',
      wallPrint: 'cert_wall_print_clinical_black_file',
      merchBundle: 'merch_bundle_clinical_black_file',
    },
  },
  {
    code: 'gold_seal_executive',
    displayName: 'Gold Seal Executive Edition',
    description: 'Boardroom-grade seal placement and gold foil accents (rendered).',
    pdfThemeCode: 'executive_gold',
    suggestedReportVariantIds: ['conference_room_incident', 'bass_boosted_bureaucrat'],
    priceCents: 999,
    currency: 'USD',
    available: true,
    productSkus: {
      themeUpgrade: 'theme_gold_seal_executive',
      officialPdf: 'cert_official_pdf_gold_seal_executive',
      wallPrint: 'cert_wall_print_gold_seal_executive',
      merchBundle: 'merch_bundle_gold_seal_executive',
    },
  },
  {
    code: 'courtroom_dossier',
    displayName: 'Courtroom Dossier',
    description: 'Burgundy ribbon, cream paper, exhibits-table typography.',
    pdfThemeCode: 'courtroom',
    suggestedReportVariantIds: ['cerulean_event', 'gaslight_sonata'],
    priceCents: 899,
    currency: 'USD',
    available: true,
    productSkus: {
      themeUpgrade: 'theme_courtroom_dossier',
      officialPdf: 'cert_official_pdf_courtroom_dossier',
      wallPrint: 'cert_wall_print_courtroom_dossier',
      merchBundle: 'merch_bundle_courtroom_dossier',
    },
  },
  {
    code: 'luxury_lab_edition',
    displayName: 'Luxury Lab Edition',
    description: 'Sterile lab chic with jewel-tone threat rings — for connoisseurs of data.',
    pdfThemeCode: 'luxury_lab',
    suggestedReportVariantIds: ['cerulean_event', 'the_philosopher'],
    priceCents: 899,
    currency: 'USD',
    available: true,
    productSkus: {
      themeUpgrade: 'theme_luxury_lab_edition',
      officialPdf: 'cert_official_pdf_luxury_lab_edition',
      wallPrint: 'cert_wall_print_luxury_lab_edition',
      merchBundle: 'merch_bundle_luxury_lab_edition',
    },
  },
  {
    code: 'roast_mode_certificate',
    displayName: 'Roast Mode Certificate',
    description: 'Ceremonial counter-classification layout — maximum targeted dispatch.',
    pdfThemeCode: 'roast_mode',
    suggestedReportVariantIds: ['gaslight_sonata', 'velvet_foghorn'],
    priceCents: 499,
    currency: 'USD',
    available: true,
    productSkus: {
      themeUpgrade: 'theme_roast_mode_certificate',
      officialPdf: 'cert_official_pdf_roast_mode_certificate',
      wallPrint: 'cert_wall_print_roast_mode_certificate',
      merchBundle: 'merch_bundle_roast_mode_certificate',
    },
  },
  {
    code: 'roommate_party_pack',
    displayName: 'Roommate / Party Pack',
    description: 'High-saturation party skin — readable from across the room.',
    pdfThemeCode: 'party_pack',
    suggestedReportVariantIds: ['velvet_foghorn', 'melancholy_jazz_fusion'],
    priceCents: 699,
    currency: 'USD',
    available: true,
    productSkus: {
      themeUpgrade: 'theme_roommate_party_pack',
      officialPdf: 'cert_official_pdf_roommate_party_pack',
      wallPrint: 'cert_wall_print_roommate_party_pack',
      merchBundle: 'merch_bundle_roommate_party_pack',
    },
  },
];

const BY_CODE: ReadonlyMap<string, PremiumArtifactTheme> = new Map(
  PREMIUM_ARTIFACT_THEMES.map((t) => [t.code, t]),
);

export function getPremiumArtifactTheme(code: string): PremiumArtifactTheme | undefined {
  return BY_CODE.get(code);
}

export function listPremiumArtifactThemes(): readonly PremiumArtifactTheme[] {
  return PREMIUM_ARTIFACT_THEMES;
}
