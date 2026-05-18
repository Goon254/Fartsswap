/** Mirrors backend `PremiumIntentResponseDto` fields we use on the client. */
export interface PremiumIntent {
  id: string;
  sessionId?: string;
  reportId?: string;
  kind: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  lifecycleState?: string;
  commerceThemeCode?: string;
  productSku?: string;
  amountCents?: number;
  currency?: string;
  checkoutExternalId?: string;
  fulfillmentRef?: string;
  fulfilledAt?: string;
  updatedAt?: string;
}
