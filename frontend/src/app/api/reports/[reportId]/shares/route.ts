import { NextResponse } from 'next/server';

import {
  buildForwardedRequestHeaders,
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

type RouteContext = {
  params: Promise<{ reportId: string }>;
};

const FORWARD_POST_HEADERS = ['cookie', 'content-type'] as const;

export async function POST(request: Request, ctx: RouteContext): Promise<NextResponse> {
  const { reportId } = await ctx.params;
  const trimmedReportId = reportId?.trim();
  if (!trimmedReportId) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = `/api/v1/reports/${encodeURIComponent(trimmedReportId)}/shares`;
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
