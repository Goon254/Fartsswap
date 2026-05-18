import { NextResponse } from 'next/server';

type RouteCtx = { params: Promise<{ path?: string[] }> };

function upstreamBase(): string {
  return process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
}

function targetUrl(request: Request, segments: string[]): string {
  const tail = segments.map((s) => encodeURIComponent(s)).join('/');
  const path = `/api/v1/ops/sponsorship${tail ? `/${tail}` : ''}`;
  const u = new URL(request.url);
  return `${upstreamBase().replace(/\/+$/, '')}${path}${u.search}`;
}

async function forward(request: Request, method: 'GET' | 'POST', segments: string[]): Promise<NextResponse> {
  const cookie = request.headers.get('cookie') ?? '';
  const clientKey = request.headers.get('x-ops-key');
  const opsKey = clientKey ?? process.env.OPS_CONSOLE_SECRET ?? '';
  const url = targetUrl(request, segments);
  const headers: Record<string, string> = {
    ...(opsKey ? { 'x-ops-key': opsKey } : {}),
    ...(cookie ? { cookie } : {}),
  };
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

export async function GET(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  return forward(request, 'GET', path);
}

export async function POST(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  return forward(request, 'POST', path);
}
