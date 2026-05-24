import { NextResponse } from 'next/server';
import { resolveOpsKeyForRequest, opsUnauthorizedResponse } from '@/lib/ops-upstream';

/** Server-side proxy to the Nest ops dashboard (requires staff cookie or x-ops-key). */
export async function GET(req: Request): Promise<NextResponse> {
  const opsKey = resolveOpsKeyForRequest(req);
  if (!opsKey) {
    return opsUnauthorizedResponse();
  }

  const url = new URL(req.url);
  const hoursRaw = url.searchParams.get('hours');
  const hours = hoursRaw === null ? 24 : Number.parseInt(hoursRaw, 10);
  const safeHours = Number.isFinite(hours) ? Math.min(720, Math.max(1, hours)) : 24;

  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';

  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/v1/ops/dashboard?hours=${safeHours}`, {
      headers: { 'x-ops-key': opsKey },
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
