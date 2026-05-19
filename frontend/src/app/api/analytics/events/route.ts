import { NextResponse } from 'next/server';

import {
  buildForwardedRequestHeaders,
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

const FORWARD_POST_HEADERS = ['cookie', 'content-type'] as const;
const UPSTREAM_PATH = '/api/v1/analytics/events';

export async function POST(request: Request): Promise<NextResponse> {
  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const target = buildUpstreamRequestUrl(base.baseUrl, UPSTREAM_PATH, request.url);
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
