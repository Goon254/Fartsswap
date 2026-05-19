import { NextResponse } from 'next/server';

import {
  buildForwardedRequestHeaders,
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const FORWARD_GET_HEADERS = ['cookie'] as const;

function buildUpstreamArtifactsPath(pathSegments: string[]): string {
  const tail = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  return `/api/v1/artifacts/${tail}`;
}

export async function GET(request: Request, ctx: RouteContext): Promise<NextResponse> {
  const { path } = await ctx.params;
  if (!path?.length) {
    return NextResponse.json({ error: 'Missing artifact path' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = buildUpstreamArtifactsPath(path);
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
