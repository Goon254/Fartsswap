import { NextResponse } from 'next/server';

import {
  STREAMING_REQUEST_BODY_INIT,
  buildForwardedRequestHeaders,
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

const UPSTREAM_PATH = '/api/v1/audio/uploads';

const FORWARD_REQUEST_HEADERS = ['cookie', 'content-type'] as const;

export async function POST(request: Request): Promise<NextResponse> {
  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const contentType = request.headers.get('content-type');
  if (!contentType) {
    return NextResponse.json(
      { error: 'Missing Content-Type (multipart uploads require a boundary)' },
      { status: 400 },
    );
  }

  const target = buildUpstreamRequestUrl(base.baseUrl, UPSTREAM_PATH, request.url);
  const headers = buildForwardedRequestHeaders(request, FORWARD_REQUEST_HEADERS);

  const body = request.body;

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      cache: 'no-store',
      redirect: 'manual',
      headers,
      ...(body ? { body, ...STREAMING_REQUEST_BODY_INIT } : {}),
    });
    return toProxiedNextResponse(upstream);
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }
}
