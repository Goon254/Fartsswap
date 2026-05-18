import { NextResponse } from 'next/server';

type RouteCtx = { params: Promise<{ path?: string[] }> };

function upstreamBase(): string {
  return process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
}

function targetUrl(request: Request, segments: string[]): string {
  const tail = segments.map((s) => encodeURIComponent(s)).join('/');
  const path = `/api/v1/fulfillment/webhooks${tail ? `/${tail}` : ''}`;
  const u = new URL(request.url);
  return `${upstreamBase().replace(/\/+$/, '')}${path}${u.search}`;
}

export async function POST(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  const secret = process.env.POD_WEBHOOK_SECRET;
  const url = targetUrl(request, path);
  const headers: Record<string, string> = {};
  const ct = request.headers.get('content-type');
  if (ct) headers['content-type'] = ct;
  if (secret) headers['x-pod-webhook-secret'] = secret;
  try {
    const res = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers,
      body: await request.text(),
    });
    const text = await res.text();
    const rct = res.headers.get('content-type') ?? 'application/json';
    return new NextResponse(text, { status: res.status, headers: { 'content-type': rct } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
