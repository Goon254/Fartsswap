import { NextResponse } from 'next/server';

export async function GET(req: Request): Promise<NextResponse> {
  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const cookie = req.headers.get('cookie') ?? '';
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/v1/wrapped/current`, {
      cache: 'no-store',
      headers: { ...(cookie ? { cookie } : {}) },
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
