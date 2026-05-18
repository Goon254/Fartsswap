import { CREATOR_FEATURE_KEYS, isCreatorFeatureKey } from './creator-feature-keys';

describe('creator-feature-keys', () => {
  it('recognises known gates', () => {
    expect(isCreatorFeatureKey('batch_generation')).toBe(true);
    expect(isCreatorFeatureKey('nope')).toBe(false);
    expect(CREATOR_FEATURE_KEYS).toContain('custom_campaign_tooling');
  });
});
