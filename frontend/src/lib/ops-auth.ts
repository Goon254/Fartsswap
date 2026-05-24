import { createHmac, timingSafeEqual } from 'crypto';

/** HttpOnly cookie proving the browser completed staff login. */
export const OPS_AUTH_COOKIE = 'farts_ops_auth';

const OPS_AUTH_PAYLOAD = 'farts-ops-console-v1';

export function getOpsConsoleSecret(): string | undefined {
  const secret = process.env.OPS_CONSOLE_SECRET?.trim();
  return secret && secret.length > 0 ? secret : undefined;
}

export function isOpsAuthConfigured(): boolean {
  const secret = getOpsConsoleSecret();
  if (!secret) return false;
  if (process.env.NODE_ENV === 'production') {
    return secret.length >= 16;
  }
  return true;
}

export function opsAuthToken(secret: string): string {
  return createHmac('sha256', secret).update(OPS_AUTH_PAYLOAD).digest('hex');
}

export function verifyOpsAuthCookie(cookieValue: string | undefined, secret?: string): boolean {
  const configured = secret ?? getOpsConsoleSecret();
  if (!configured || !cookieValue) return false;
  const expected = opsAuthToken(configured);
  try {
    const a = Buffer.from(cookieValue, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyOpsClientKey(clientKey: string | undefined, secret?: string): boolean {
  const configured = secret ?? getOpsConsoleSecret();
  if (!configured || !clientKey) return false;
  try {
    const a = Buffer.from(clientKey, 'utf8');
    const b = Buffer.from(configured, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function hasValidOpsAuth(args: {
  cookie?: string | null;
  clientKey?: string | null;
  secret?: string;
}): boolean {
  if (!isOpsAuthConfigured()) {
    return process.env.NODE_ENV !== 'production';
  }
  return (
    verifyOpsAuthCookie(args.cookie ?? undefined, args.secret) ||
    verifyOpsClientKey(args.clientKey ?? undefined, args.secret)
  );
}

export function safeOpsReturnTo(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/moderation-lab';
  if (raw.startsWith('/ops/login')) return '/moderation-lab';
  return raw;
}

export const OPS_AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;
