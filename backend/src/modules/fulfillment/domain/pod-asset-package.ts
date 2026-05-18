import type { MerchReadyBundleV1 } from '../../artifact-commerce/domain/merch-ready-bundle';

/**
 * Provider-ready print package (no raw PII beyond what the user already opted into for merch).
 */
export interface PodAssetPackageV1 {
  readonly version: 1;
  readonly bundle: MerchReadyBundleV1;
  readonly printProfile: {
    readonly primaryProduct: string;
    readonly dpi: number;
    readonly profile: string;
  };
  readonly personalization: {
    readonly headline: string;
    readonly classification: string;
    readonly sealLabel: string;
    readonly badgeLabel?: string;
    readonly publicSlug?: string;
    readonly commerceThemeCode: string;
    readonly pdfThemeCode: string;
  };
  readonly assetRefs: {
    readonly artifactApiHints: MerchReadyBundleV1['artifactApiHints'];
    readonly transparentOrHighResRefs: MerchReadyBundleV1['transparentOrHighResRefs'];
  };
}

export function buildPodAssetPackage(args: {
  bundle: MerchReadyBundleV1;
  primaryPodProductType: string;
}): PodAssetPackageV1 {
  const { bundle, primaryPodProductType } = args;
  let profile: string = bundle.printable.officialPdf.profile;
  let dpi = bundle.printable.officialPdf.dpi;
  if (primaryPodProductType === 'wall_certificate_print') {
    profile = bundle.printable.wallCertificate.profile;
    dpi = bundle.printable.wallCertificate.dpi;
  }
  return {
    version: 1,
    bundle,
    printProfile: { primaryProduct: primaryPodProductType, dpi, profile },
    personalization: {
      headline: bundle.headline,
      classification: bundle.classification,
      sealLabel: bundle.sealLabel,
      ...(bundle.badgeLabel !== undefined ? { badgeLabel: bundle.badgeLabel } : {}),
      ...(bundle.publicSlug !== undefined ? { publicSlug: bundle.publicSlug } : {}),
      commerceThemeCode: bundle.commerceThemeCode,
      pdfThemeCode: bundle.pdfThemeCode,
    },
    assetRefs: {
      artifactApiHints: bundle.artifactApiHints,
      transparentOrHighResRefs: bundle.transparentOrHighResRefs,
    },
  };
}
