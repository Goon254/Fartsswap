import { NextResponse } from 'next/server';
import {
  getOpsConsoleSecret,
  hasValidOpsAuth,
  OPS_AUTH_COOKIE,
  verifyOpsClientKey,
} from '@/lib/ops-auth';

export async function resolveOpsKeyForRequest(request: Request): Promise<string | null> {
  const secret = getOpsConsoleSecret();
  if (!secret) return null;

  const cookie = request.headers.get('cookie') ?? '';
  const cookieValue = cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${OPS_AUTH_COOKIE}=`))
    ?.slice(OPS_AUTH_COOKIE.length + 1);

  const clientKey = request.headers.get('x-ops-key') ?? undefined;

  if (!(await hasValidOpsAuth({ cookie: cookieValue, clientKey, secret }))) {
    return null;
  }

  if (clientKey && verifyOpsClientKey(clientKey, secret)) {
    return clientKey;
  }

  return secret;
}

export function opsUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Staff sign-in required. Open /ops/login and enter the ops password.' },
    { status: 401 },
  );
}

export async function forwardOpsRequest(
  request: Request,
  method: 'GET' | 'POST',
  upstreamPath: string,
): Promise<NextResponse> {
  const opsKey = await resolveOpsKeyForRequest(request);
  if (!opsKey) {
    return opsUnauthorizedResponse();
  }

  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const u = new URL(request.url);
  const url = `${base.replace(/\/+$/, '')}${upstreamPath}${u.search}`;

  const headers: Record<string, string> = {
    'x-ops-key': opsKey,
  };
  const cookie = request.headers.get('cookie');
  if (cookie) headers.cookie = cookie;
  const actor = request.headers.get('x-ops-actor');
  if (actor) headers['x-ops-actor'] = actor;
  if (method === 'POST') {
    const ct = request.headers.get('content-type');
    if (ct) headers['content-type'] = ct;
  }

  try {
    const res = await fetch(url, {
      method,
      cache: 'no-store',
      headers,
      ...(method === 'POST' ? { body: await request.text() } : {}),
    });
    const text = await res.text();
    const ct = res.headers.get('content-type') ?? 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': ct } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
