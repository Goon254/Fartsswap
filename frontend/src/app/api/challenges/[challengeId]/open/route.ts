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

const FORWARD_POST_HEADERS = ['cookie', 'content-type'] as const;

export async function POST(request: Request, ctx: RouteContext): Promise<NextResponse> {
  const { challengeId } = await ctx.params;
  const trimmedChallengeId = challengeId?.trim();
  if (!trimmedChallengeId) {
    return NextResponse.json({ error: 'Missing challenge id' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = `/api/v1/challenges/${encodeURIComponent(trimmedChallengeId)}/open`;
  const target = buildUpstreamRequestUrl(base.baseUrl, upstreamPath, request.url);
  const headers = buildForwardedRequestHeaders(request, FORWARD_POST_HEADERS);

  let body: ArrayBuffer;
  try {
    body = await request.arrayBuffer();
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      cache: 'no-store',
      redirect: 'manual',
      headers,
      body,
    });
    return toProxiedNextResponse(upstream);
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }
}
