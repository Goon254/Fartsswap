import type { PremiumIntent } from '../../../../shared/domain/models';
import type { PremiumIntentEntity } from './premium-intent.entity';

export function mapPremiumIntentEntityToDomain(entity: PremiumIntentEntity): PremiumIntent {
  return {
    id: entity.id,
    ...(entity.sessionId !== undefined ? { sessionId: entity.sessionId } : {}),
    ...(entity.reportId !== undefined ? { reportId: entity.reportId } : {}),
    kind: entity.kind,
    ...(entity.payload !== undefined ? { payload: entity.payload } : {}),
    createdAt: entity.createdAt.toISOString(),
    lifecycleState: entity.lifecycleState,
    ...(entity.commerceThemeCode !== undefined && entity.commerceThemeCode !== ''
      ? { commerceThemeCode: entity.commerceThemeCode }
      : {}),
    ...(entity.productSku !== undefined && entity.productSku !== '' ? { productSku: entity.productSku } : {}),
    ...(entity.amountCents !== undefined ? { amountCents: entity.amountCents } : {}),
    currency: entity.currency,
    ...(entity.checkoutExternalId !== undefined && entity.checkoutExternalId !== ''
      ? { checkoutExternalId: entity.checkoutExternalId }
      : {}),
    ...(entity.fulfillmentRef !== undefined && entity.fulfillmentRef !== ''
      ? { fulfillmentRef: entity.fulfillmentRef }
      : {}),
    ...(entity.fulfilledAt !== undefined ? { fulfilledAt: entity.fulfilledAt.toISOString() } : {}),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
