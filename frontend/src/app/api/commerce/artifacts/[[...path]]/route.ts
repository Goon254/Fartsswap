import { NextResponse } from 'next/server';

import {
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

type RouteCtx = { params: Promise<{ path?: string[] }> };

async function forward(request: Request, method: 'GET' | 'POST', segments: string[]): Promise<NextResponse> {
  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const tail = segments.map((s) => encodeURIComponent(s)).join('/');
  const upstreamPath = `/api/v1/commerce/artifacts${tail ? `/${tail}` : ''}`;
  const target = buildUpstreamRequestUrl(base.baseUrl, upstreamPath, request.url);
  const cookie = request.headers.get('cookie') ?? '';
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  if (method === 'POST') {
    const ct = request.headers.get('content-type');
    if (ct) headers['content-type'] = ct;
    const idem = request.headers.get('idempotency-key');
    if (idem) headers['idempotency-key'] = idem;
  }
  try {
    const res = await fetch(target, {
      method,
      cache: 'no-store',
      headers,
      ...(method === 'POST' ? { body: await request.text() } : {}),
    });
    const text = await res.text();
    const ct = res.headers.get('content-type') ?? 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': ct } });
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }
}

export async function GET(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  return forward(request, 'GET', path);
}

export async function POST(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  return forward(request, 'POST', path);
}
