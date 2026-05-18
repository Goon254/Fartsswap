export const SUBSCRIPTION_BILLING_PORT = Symbol('SUBSCRIPTION_BILLING_PORT');

export interface BillingStartSubscriptionInput {
  readonly holderKind: 'anonymous_session';
  readonly holderId: string;
  readonly planCode: string;
  readonly periodDays: number;
}

export interface BillingStartSubscriptionResult {
  readonly billingCustomerRef: string;
  readonly billingSubscriptionRef: string;
}

/**
 * Provider-agnostic subscription lifecycle (Stripe-shaped later; mock today).
 */
export interface SubscriptionBillingPort {
  startMockSubscription(input: BillingStartSubscriptionInput): Promise<BillingStartSubscriptionResult>;
}
