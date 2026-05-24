/** HttpOnly cookie proving the browser completed staff login. */
export const OPS_AUTH_COOKIE = 'farts_ops_auth';

const OPS_AUTH_PAYLOAD = 'farts-ops-console-v1';
const textEncoder = new TextEncoder();

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

/** Constant-time UTF-8 string compare (Edge-safe; no Node `crypto`). */
export function timingSafeEqualUtf8(a: string, b: string): boolean {
  const ab = textEncoder.encode(a);
  const bb = textEncoder.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) {
    diff |= ab[i]! ^ bb[i]!;
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function opsAuthToken(secret: string): Promise<string> {
  return hmacSha256Hex(secret, OPS_AUTH_PAYLOAD);
}

export async function verifyOpsAuthCookie(
  cookieValue: string | undefined,
  secret?: string,
): Promise<boolean> {
  const configured = secret ?? getOpsConsoleSecret();
  if (!configured || !cookieValue) return false;
  const expected = await opsAuthToken(configured);
  return timingSafeEqualUtf8(cookieValue, expected);
}

export function verifyOpsClientKey(clientKey: string | undefined, secret?: string): boolean {
  const configured = secret ?? getOpsConsoleSecret();
  if (!configured || !clientKey) return false;
  return timingSafeEqualUtf8(clientKey, configured);
}

export async function hasValidOpsAuth(args: {
  cookie?: string | null;
  clientKey?: string | null;
  secret?: string;
}): Promise<boolean> {
  if (!isOpsAuthConfigured()) {
    return process.env.NODE_ENV !== 'production';
  }
  return (
    (await verifyOpsAuthCookie(args.cookie ?? undefined, args.secret)) ||
    verifyOpsClientKey(args.clientKey ?? undefined, args.secret)
  );
}

export function safeOpsReturnTo(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/moderation-lab';
  if (raw.startsWith('/ops/login')) return '/moderation-lab';
  return raw;
}

export const OPS_AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;
