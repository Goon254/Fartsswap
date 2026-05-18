import { NextRequest, NextResponse } from 'next/server';

const POST_COMMANDS = new Set(['classify', 'challenge', 'badge', 'wrapped', 'share']);

interface RouteParams {
  params: Promise<{ path?: string[] }>;
}

export async function POST(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  const seg = path[0];
  if (!seg || !POST_COMMANDS.has(seg)) {
    return NextResponse.json({ error: 'Unknown or unsupported command' }, { status: 404 });
  }
  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const secret = process.env.CREATOR_TOOLS_SECRET ?? process.env.OPS_CONSOLE_SECRET;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['x-creator-tools-key'] = secret;
  }
  const body = await req.text();
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/v1/creator-tools/discord/${seg}`, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream creator-tools failed', status: res.status, detail: text.slice(0, 800) },
        { status: res.status === 403 ? 403 : 502 },
      );
    }
    return NextResponse.json(JSON.parse(text) as unknown);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: RouteParams): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  if (path[0] !== 'methane-index') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const base = process.env.FARTS_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const secret = process.env.CREATOR_TOOLS_SECRET ?? process.env.OPS_CONSOLE_SECRET;
  const headers: Record<string, string> = {};
  if (secret) {
    headers['x-creator-tools-key'] = secret;
  }
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const suffix = qs ? `?${qs}` : '';
  try {
    const res = await fetch(
      `${base.replace(/\/+$/, '')}/api/v1/creator-tools/discord/methane-index${suffix}`,
      { method: 'GET', headers, cache: 'no-store' },
    );
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream creator-tools failed', status: res.status, detail: text.slice(0, 800) },
        { status: res.status === 403 ? 403 : 502 },
      );
    }
    return NextResponse.json(JSON.parse(text) as unknown);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
