export const CREATOR_FEATURE_KEYS = [
  'batch_generation',
  'transparent_png_export',
  'server_bulletin_automation',
  'badge_leaderboard_automation',
  'event_mode_qr_wall',
  'custom_campaign_tooling',
] as const;

export type CreatorFeatureKey = (typeof CREATOR_FEATURE_KEYS)[number];

export function isCreatorFeatureKey(v: string): v is CreatorFeatureKey {
  return (CREATOR_FEATURE_KEYS as readonly string[]).includes(v);
}
