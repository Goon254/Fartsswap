/** Stable dossier key for grouping — matches frontend variant ids when possible. */
export function variantKeyFromReport(classification: string, variantId?: string | null): string {
  const v = variantId?.trim();
  if (v) return v;
  const slug = classification
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug.length > 0 ? slug : 'unknown';
}
