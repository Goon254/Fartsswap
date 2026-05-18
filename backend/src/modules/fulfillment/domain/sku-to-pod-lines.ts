import type { PremiumArtifactTheme } from '../../artifact-commerce/domain/premium-artifact-catalog';
import type { PodProductType } from './pod-product-types';

export interface PodLineDraft {
  readonly podProductType: PodProductType;
  readonly commerceSku: string;
  readonly quantity: number;
}

/**
 * Maps commerce SKUs from the premium catalog into one or more provider-neutral line items.
 * Bundle SKUs expand into multiple physical lines; PDF / wall stay single-line.
 */
export function commerceSkuToPodLineDrafts(args: {
  productSku: string;
  theme: PremiumArtifactTheme;
}): readonly PodLineDraft[] {
  const { productSku, theme } = args;
  const skus = theme.productSkus;

  if (productSku === skus.officialPdf || productSku.includes('official_pdf')) {
    return [{ podProductType: 'official_pdf_certificate', commerceSku: productSku, quantity: 1 }];
  }
  if (productSku === skus.wallPrint || productSku.includes('wall_print')) {
    return [{ podProductType: 'wall_certificate_print', commerceSku: productSku, quantity: 1 }];
  }
  if (productSku === skus.merchBundle || productSku.includes('merch_bundle')) {
    return [
      { podProductType: 'sticker', commerceSku: `${productSku}__sticker`, quantity: 1 },
      { podProductType: 'mug', commerceSku: `${productSku}__mug`, quantity: 1 },
      { podProductType: 'custom_nameplate_print', commerceSku: `${productSku}__nameplate`, quantity: 1 },
    ];
  }
  if (productSku === skus.themeUpgrade || productSku.includes('theme_')) {
    return [{ podProductType: 'official_pdf_certificate', commerceSku: productSku, quantity: 1 }];
  }
  return [{ podProductType: 'official_pdf_certificate', commerceSku: productSku, quantity: 1 }];
}
