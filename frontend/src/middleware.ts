import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  hasValidOpsAuth,
  isOpsAuthConfigured,
  OPS_AUTH_COOKIE,
  safeOpsReturnTo,
} from '@/lib/ops-auth';

const STAFF_PAGE_PREFIXES = [
  '/moderation-lab',
  '/fulfillment-lab',
  '/sponsor-lab',
] as const;

function isStaffPage(pathname: string): boolean {
  if (pathname === '/ops/login') return false;
  if (pathname === '/gallery-ops' || pathname === '/mission-control') return true;
  if (pathname === '/ops' || pathname.startsWith('/ops/')) return true;
  return STAFF_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isProtectedOpsApi(pathname: string): boolean {
  if (!pathname.startsWith('/api/ops')) return false;
  if (pathname.startsWith('/api/ops/auth')) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isStaffPage(pathname) && !isProtectedOpsApi(pathname)) {
    return NextResponse.next();
  }

  if (!isOpsAuthConfigured()) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(OPS_AUTH_COOKIE)?.value;
  const clientKey = request.headers.get('x-ops-key');

  if (hasValidOpsAuth({ cookie, clientKey })) {
    return NextResponse.next();
  }

  if (isProtectedOpsApi(pathname)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = '/ops/login';
  login.searchParams.set('returnTo', safeOpsReturnTo(pathname));
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/moderation-lab/:path*',
    '/fulfillment-lab/:path*',
    '/sponsor-lab/:path*',
    '/gallery-ops',
    '/mission-control',
    '/ops',
    '/ops/:path*',
    '/api/ops/:path*',
  ],
};
