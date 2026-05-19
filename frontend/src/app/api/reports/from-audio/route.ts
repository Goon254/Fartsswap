import { NextResponse } from 'next/server';

import {
  buildForwardedRequestHeaders,
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

const UPSTREAM_PATH = '/api/v1/reports/from-audio';

const FORWARD_REQUEST_HEADERS = ['cookie', 'content-type', 'idempotency-key'] as const;

export async function POST(request: Request): Promise<NextResponse> {
  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const headers = buildForwardedRequestHeaders(request, FORWARD_REQUEST_HEADERS);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  let body: ArrayBuffer;
  try {
    body = await request.arrayBuffer();
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }

  const target = buildUpstreamRequestUrl(base.baseUrl, UPSTREAM_PATH, request.url);

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
