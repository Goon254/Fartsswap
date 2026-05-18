import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/v1/methane-index/current`, { cache: 'no-store' });
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
