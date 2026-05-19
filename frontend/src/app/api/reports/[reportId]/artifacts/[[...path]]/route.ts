import { NextResponse } from 'next/server';

import {
  buildForwardedRequestHeaders,
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

type RouteContext = {
  params: Promise<{ reportId: string; path?: string[] }>;
};

const FORWARD_GET_HEADERS = ['cookie'] as const;
const FORWARD_POST_HEADERS = ['cookie', 'content-type', 'idempotency-key'] as const;

function buildUpstreamArtifactsPath(reportId: string, pathSegments: string[] | undefined): string {
  const base = `/api/v1/reports/${encodeURIComponent(reportId)}/artifacts`;
  if (!pathSegments?.length) return base;
  const tail = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${base}/${tail}`;
}

async function proxyArtifacts(
  request: Request,
  ctx: RouteContext,
  method: 'GET' | 'POST',
): Promise<NextResponse> {
  const { reportId, path } = await ctx.params;
  const trimmedReportId = reportId?.trim();
  if (!trimmedReportId) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = buildUpstreamArtifactsPath(trimmedReportId, path);
  const target = buildUpstreamRequestUrl(base.baseUrl, upstreamPath, request.url);
  const headerNames = method === 'GET' ? FORWARD_GET_HEADERS : FORWARD_POST_HEADERS;
  const headers = buildForwardedRequestHeaders(request, headerNames);

  try {
    if (method === 'GET') {
      const upstream = await fetch(target, {
        method: 'GET',
        cache: 'no-store',
        redirect: 'manual',
        headers,
      });
      return toProxiedNextResponse(upstream);
    }

    let body: ArrayBuffer;
    try {
      body = await request.arrayBuffer();
    } catch (e) {
      return upstreamFetchErrorResponse(e);
    }

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

export async function GET(request: Request, ctx: RouteContext): Promise<NextResponse> {
  return proxyArtifacts(request, ctx, 'GET');
}

export async function POST(request: Request, ctx: RouteContext): Promise<NextResponse> {
  return proxyArtifacts(request, ctx, 'POST');
}
