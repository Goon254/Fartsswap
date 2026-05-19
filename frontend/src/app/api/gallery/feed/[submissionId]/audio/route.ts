import { NextResponse } from 'next/server';

import {
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

/** Public published-feed audio only (no session cookie required). */
export async function GET(request: Request, ctx: RouteContext): Promise<NextResponse> {
  const { submissionId } = await ctx.params;
  const trimmed = submissionId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = `/api/v1/gallery/feed/${encodeURIComponent(trimmed)}/audio`;
  const target = buildUpstreamRequestUrl(base.baseUrl, upstreamPath, request.url);

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'manual',
    });
    return toProxiedNextResponse(upstream);
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }
}
