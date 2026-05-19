import { NextResponse } from 'next/server';

import {
  buildForwardedRequestHeaders,
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

type RouteContext = {
  params: Promise<{ challengeId: string }>;
};

const FORWARD_GET_HEADERS = ['cookie'] as const;

export async function GET(request: Request, ctx: RouteContext): Promise<NextResponse> {
  const { challengeId } = await ctx.params;
  const trimmedChallengeId = challengeId?.trim();
  if (!trimmedChallengeId) {
    return NextResponse.json({ error: 'Missing challenge id' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = `/api/v1/challenges/${encodeURIComponent(trimmedChallengeId)}`;
  const target = buildUpstreamRequestUrl(base.baseUrl, upstreamPath, request.url);
  const headers = buildForwardedRequestHeaders(request, FORWARD_GET_HEADERS);

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'manual',
      headers,
    });
    return toProxiedNextResponse(upstream);
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }
}
