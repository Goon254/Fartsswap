import { NextResponse } from 'next/server';

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const limitRaw = url.searchParams.get('limit');
  const parsed = limitRaw === null ? 4 : Number.parseInt(limitRaw, 10);
  const limit = Number.isFinite(parsed) ? Math.min(12, Math.max(1, parsed)) : 4;
  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/v1/methane-index/history?limit=${limit}`, {
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream failed', status: res.status }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(text) as unknown);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
