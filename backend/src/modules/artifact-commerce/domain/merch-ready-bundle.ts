import type { Report } from '../../../shared/domain/models';
import type { PremiumArtifactTheme } from './premium-artifact-catalog';

export interface MerchReadyBundleV1 {
  readonly version: 1;
  readonly reportId: string;
  readonly publicSlug?: string;
  readonly headline: string;
  readonly classification: string;
  readonly badgeLabel?: string;
  readonly sealLabel: string;
  readonly commerceThemeCode: string;
  readonly pdfThemeCode: string;
  readonly reportVariantId?: string;
  readonly printable: {
    readonly officialPdf: { readonly profile: 'A4_portrait'; readonly dpi: 300 };
    readonly wallCertificate: { readonly profile: 'A3_landscape'; readonly dpi: 300; readonly bleedMm: 3 };
  };
  /** Relative API paths (same origin as app); POD integration can map to signed URLs later. */
  readonly artifactApiHints: {
    readonly listReportArtifacts: string;
    readonly generateReportPdf: string;
    readonly getArtifactContent: string;
  };
  readonly transparentOrHighResRefs: readonly {
    readonly kind: 'share_card' | 'report_pdf' | 'placeholder';
    readonly note: string;
    readonly relativePathPattern?: string;
  }[];
}

function badgeFromReport(report: Report): string | undefined {
  const meta = report.platformMetadata;
  if (!meta || typeof meta !== 'object') return undefined;
  const badge = (meta as { badgeLabel?: unknown }).badgeLabel;
  return typeof badge === 'string' ? badge : undefined;
}

export function buildMerchReadyBundle(args: {
  report: Report;
  theme: PremiumArtifactTheme;
}): MerchReadyBundleV1 {
  const { report, theme } = args;
  const reportId = report.id;
  const badgeLabel = badgeFromReport(report);
  return {
    version: 1,
    reportId,
    ...(report.publicSlug !== undefined && report.publicSlug !== '' ? { publicSlug: report.publicSlug } : {}),
    headline: report.fartName,
    classification: report.classification,
    ...(badgeLabel !== undefined ? { badgeLabel } : {}),
    sealLabel: theme.displayName,
    commerceThemeCode: theme.code,
    pdfThemeCode: theme.pdfThemeCode,
    ...(report.variantId !== undefined && report.variantId !== ''
      ? { reportVariantId: report.variantId }
      : {}),
    printable: {
      officialPdf: { profile: 'A4_portrait', dpi: 300 },
      wallCertificate: { profile: 'A3_landscape', dpi: 300, bleedMm: 3 },
    },
    artifactApiHints: {
      listReportArtifacts: `/api/v1/reports/${reportId}/artifacts`,
      generateReportPdf: `/api/v1/reports/${reportId}/artifacts/pdf`,
      getArtifactContent: `/api/v1/artifacts/{artifactId}/content`,
    },
    transparentOrHighResRefs: [
      {
        kind: 'share_card',
        note: '1080×1920 share-card artifact when generated for this report.',
        relativePathPattern: `/api/v1/reports/${reportId}/artifacts/share-card`,
      },
      {
        kind: 'report_pdf',
        note: `PDF dossier / certificate using pdfThemeCode=${theme.pdfThemeCode}.`,
        relativePathPattern: `/api/v1/reports/${reportId}/artifacts/pdf`,
      },
      {
        kind: 'placeholder',
        note: 'Reserved for transparent PNG seal / crest exports when asset pipeline lands.',
      },
    ],
  };
}
