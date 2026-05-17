import { readSignedSessionCookie, writeSignedSessionCookie } from './session-cookie';
import type { AppConfigService } from '../../../config/config.service';

describe('session-cookie helpers', () => {
  const config = {
    isProduction: false,
    session: { ttlSeconds: 60, cookieName: 'farts_session' },
  } as unknown as AppConfigService;

  it('writeSignedSessionCookie always sets signed httpOnly Lax cookie', () => {
    const setCookie = jest.fn();
    writeSignedSessionCookie(
      { setCookie } as unknown as Parameters<typeof writeSignedSessionCookie>[0],
      'farts_session',
      'sess-1',
      config,
    );
    expect(setCookie).toHaveBeenCalledWith(
      'farts_session',
      'sess-1',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        signed: true,
        path: '/',
        maxAge: 60,
        secure: false,
      }),
    );
  });

  it('readSignedSessionCookie returns undefined when cookie is missing', () => {
    const request = {
      cookies: {},
      unsignCookie: jest.fn(),
    } as unknown as Parameters<typeof readSignedSessionCookie>[0];
    expect(readSignedSessionCookie(request, 'farts_session')).toBeUndefined();
  });

  it('readSignedSessionCookie returns undefined when signature is invalid', () => {
    const request = {
      cookies: { farts_session: 'sess-1.bogus-sig' },
      unsignCookie: () => ({ valid: false, renew: false, value: null }),
    } as unknown as Parameters<typeof readSignedSessionCookie>[0];
    expect(readSignedSessionCookie(request, 'farts_session')).toBeUndefined();
  });

  it('readSignedSessionCookie returns the value when signature is valid', () => {
    const request = {
      cookies: { farts_session: 'sess-1.valid-sig' },
      unsignCookie: () => ({ valid: true, renew: false, value: 'sess-1' }),
    } as unknown as Parameters<typeof readSignedSessionCookie>[0];
    expect(readSignedSessionCookie(request, 'farts_session')).toBe('sess-1');
  });

  it('readSignedSessionCookie refuses to trust unsigned cookies if unsignCookie is missing', () => {
    const request = {
      cookies: { farts_session: 'sess-1' },
      // no unsignCookie
    } as unknown as Parameters<typeof readSignedSessionCookie>[0];
    expect(readSignedSessionCookie(request, 'farts_session')).toBeUndefined();
  });
});
