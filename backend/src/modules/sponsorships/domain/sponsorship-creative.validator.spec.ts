import { BadRequestException } from '@nestjs/common';
import { validateSponsorshipCreative } from './sponsorship-creative.validator';

describe('validateSponsorshipCreative', () => {
  it('accepts methane_index_powered_by', () => {
    const out = validateSponsorshipCreative('methane_index_powered_by', {
      line: 'National Methane Index — courtesy of Example Co.',
      disclosure: 'Sponsored.',
      destinationUrl: 'https://example.com/about',
    });
    expect(out.line).toContain('Example');
  });

  it('rejects banned language', () => {
    expect(() =>
      validateSponsorshipCreative('methane_index_powered_by', {
        line: 'This is pornographic content',
      }),
    ).toThrow(BadRequestException);
  });

  it('requires supportingLine or url for sponsored_challenge', () => {
    expect(() => validateSponsorshipCreative('sponsored_challenge', {})).toThrow(BadRequestException);
  });
});
