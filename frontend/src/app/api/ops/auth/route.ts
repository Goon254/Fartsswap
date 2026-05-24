import { NextResponse } from 'next/server';
import {
  getOpsConsoleSecret,
  isOpsAuthConfigured,
  opsAuthToken,
  OPS_AUTH_COOKIE,
  OPS_AUTH_COOKIE_MAX_AGE_SEC,
  timingSafeEqualUtf8,
} from '@/lib/ops-auth';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: OPS_AUTH_COOKIE_MAX_AGE_SEC,
  };
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ configured: isOpsAuthConfigured() });
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = getOpsConsoleSecret();
  if (!secret || (process.env.NODE_ENV === 'production' && secret.length < 16)) {
    return NextResponse.json({ error: 'Staff login is not configured on this server.' }, { status: 503 });
  }

  let password = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  if (!timingSafeEqualUtf8(password, secret)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_AUTH_COOKIE, await opsAuthToken(secret), cookieOptions());
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_AUTH_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return res;
}
