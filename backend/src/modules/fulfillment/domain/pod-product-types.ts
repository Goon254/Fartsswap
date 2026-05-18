/** First-class POD product kinds (provider-agnostic). */
export const POD_PRODUCT_TYPES = [
  'official_pdf_certificate',
  'wall_certificate_print',
  'custom_nameplate_print',
  'sticker',
  'mug',
] as const;

export type PodProductType = (typeof POD_PRODUCT_TYPES)[number];

export function isPodProductType(v: string): v is PodProductType {
  return (POD_PRODUCT_TYPES as readonly string[]).includes(v);
}

export const POD_ORDER_STATUSES = [
  'submitted',
  'accepted',
  'in_production',
  'shipped',
  'delivered',
  'failed',
  'canceled',
] as const;

export type PodOrderStatus = (typeof POD_ORDER_STATUSES)[number];

export function isPodOrderStatus(v: string): v is PodOrderStatus {
  return (POD_ORDER_STATUSES as readonly string[]).includes(v);
}
