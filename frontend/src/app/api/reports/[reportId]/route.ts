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

const FORWARD_REQUEST_HEADERS = ['cookie'] as const;

export async function GET(request: Request, ctx: RouteContext): Promise<NextResponse> {
  const { reportId } = await ctx.params;
  const trimmedReportId = reportId?.trim();
  if (!trimmedReportId) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = `/api/v1/reports/${encodeURIComponent(trimmedReportId)}`;
  const target = buildUpstreamRequestUrl(base.baseUrl, upstreamPath, request.url);
  const headers = buildForwardedRequestHeaders(request, FORWARD_REQUEST_HEADERS);

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
