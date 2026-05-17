import { Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfigService } from '../../../config/config.service';

/**
 * Signed-cookie helpers for the anonymous session.
 *
 * Why signed: the session ID is the only identity bound to a user's reports
 * and audio; without a signature, a curl request with a guessed cookie can
 * pose as another anonymous user. `@fastify/cookie` HMAC-signs the value
 * when registered with a secret, and unsignCookie verifies it on read.
 *
 * Behavior:
 *  - readSessionCookie returns the session ID only if the signature is valid.
 *  - setSessionCookie always sets a signed value and applies httpOnly +
 *    SameSite=Lax, plus Secure in production.
 *
 * Existing API contract is preserved: clients still see a `farts_session`
 * cookie; only the value format changes (now `<id>.<sig>`).
 */

const logger = new Logger('SessionCookie');

export function readSignedSessionCookie(
  request: FastifyRequest,
  cookieName: string,
): string | undefined {
  const raw = (request.cookies as Record<string, string> | undefined)?.[cookieName];
  if (!raw) return undefined;

  // unsignCookie is added by @fastify/cookie when registered with a secret.
  const unsigner = (
    request as unknown as {
      unsignCookie?: (v: string) => { valid: boolean; renew: boolean; value: string | null };
    }
  ).unsignCookie;

  if (typeof unsigner !== 'function') {
    // Defensive: shouldn't happen because we always register with a secret.
    logger.warn('unsignCookie unavailable; refusing to trust unsigned cookie');
    return undefined;
  }

  const result = unsigner(raw);
  if (!result.valid || !result.value) {
    return undefined;
  }
  return result.value;
}

export function writeSignedSessionCookie(
  reply: FastifyReply,
  cookieName: string,
  sessionId: string,
  config: AppConfigService,
): void {
  void reply.setCookie(cookieName, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: config.session.ttlSeconds,
    secure: config.isProduction,
    signed: true,
  });
}
