export const PREMIUM_COMMERCE_LIFECYCLE_STATES = [
  'intent_created',
  'offer_presented',
  'theme_selected',
  'checkout_started',
  'checkout_completed',
  'artifact_fulfilled',
] as const;

export type PremiumCommerceLifecycleState = (typeof PREMIUM_COMMERCE_LIFECYCLE_STATES)[number];

export function isPremiumCommerceLifecycleState(v: string): v is PremiumCommerceLifecycleState {
  return (PREMIUM_COMMERCE_LIFECYCLE_STATES as readonly string[]).includes(v);
}

const ALLOWED: Readonly<Record<PremiumCommerceLifecycleState, readonly PremiumCommerceLifecycleState[]>> = {
  intent_created: ['offer_presented', 'theme_selected'],
  offer_presented: ['theme_selected'],
  theme_selected: ['checkout_started'],
  checkout_started: ['checkout_completed'],
  checkout_completed: ['artifact_fulfilled'],
  artifact_fulfilled: [],
};

export function canTransitionCommerceLifecycle(
  from: PremiumCommerceLifecycleState,
  to: PremiumCommerceLifecycleState,
): boolean {
  return ALLOWED[from].includes(to);
}
