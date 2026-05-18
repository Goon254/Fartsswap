import { getPremiumArtifactTheme } from '../../artifact-commerce/domain/premium-artifact-catalog';
import { commerceSkuToPodLineDrafts } from './sku-to-pod-lines';

describe('commerceSkuToPodLineDrafts', () => {
  const theme = getPremiumArtifactTheme('clinical_black_file')!;

  it('maps official PDF sku', () => {
    const lines = commerceSkuToPodLineDrafts({ productSku: theme.productSkus.officialPdf, theme });
    expect(lines).toHaveLength(1);
    expect(lines[0].podProductType).toBe('official_pdf_certificate');
  });

  it('maps wall print sku', () => {
    const lines = commerceSkuToPodLineDrafts({ productSku: theme.productSkus.wallPrint, theme });
    expect(lines[0].podProductType).toBe('wall_certificate_print');
  });

  it('expands merch bundle into sticker, mug, nameplate', () => {
    const lines = commerceSkuToPodLineDrafts({ productSku: theme.productSkus.merchBundle, theme });
    expect(lines.map((l) => l.podProductType).sort()).toEqual(
      ['custom_nameplate_print', 'mug', 'sticker'].sort(),
    );
  });
});
