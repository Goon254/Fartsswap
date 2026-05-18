import { NextResponse } from 'next/server';

/**
 * Server-side proxy to the Nest ops dashboard (keeps OPS_CONSOLE_SECRET off the client).
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const hoursRaw = url.searchParams.get('hours');
  const hours = hoursRaw === null ? 24 : Number.parseInt(hoursRaw, 10);
  const safeHours = Number.isFinite(hours) ? Math.min(720, Math.max(1, hours)) : 24;

  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const secret = process.env.OPS_CONSOLE_SECRET;

  const headers: Record<string, string> = {};
  if (secret) {
    headers['x-ops-key'] = secret;
  }

  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/v1/ops/dashboard?hours=${safeHours}`, {
      headers,
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream ops dashboard failed', status: res.status, detail: text.slice(0, 500) },
        { status: res.status === 403 ? 403 : 502 },
      );
    }
    return NextResponse.json(JSON.parse(text) as unknown);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
