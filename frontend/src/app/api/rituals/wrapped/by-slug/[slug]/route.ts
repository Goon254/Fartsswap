import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, ctx: RouteParams): Promise<NextResponse> {
  const { slug } = await ctx.params;
  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const cookie = req.headers.get('cookie') ?? '';
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/v1/wrapped/by-slug/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      headers: { ...(cookie ? { cookie } : {}) },
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream failed', status: res.status }, { status: res.status === 404 ? 404 : 502 });
    }
    return NextResponse.json(JSON.parse(text) as unknown);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
