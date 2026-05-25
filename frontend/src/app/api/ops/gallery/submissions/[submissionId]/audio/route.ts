import { NextResponse } from 'next/server';

import { opsUnauthorizedResponse, resolveOpsKeyForRequest } from '@/lib/ops-upstream';
import {
  buildUpstreamRequestUrl,
  resolveUpstreamBaseUrl,
  toProxiedNextResponse,
  upstreamFetchErrorResponse,
} from '@/lib/upstream-proxy';

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

/** Staff-only specimen audio for the moderation lab (requires ops cookie). */
export async function GET(request: Request, ctx: RouteContext): Promise<NextResponse> {
  const opsKey = await resolveOpsKeyForRequest(request);
  if (!opsKey) {
    return opsUnauthorizedResponse();
  }

  const { submissionId } = await ctx.params;
  const trimmed = submissionId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
  }

  const base = resolveUpstreamBaseUrl();
  if (!base.ok) return base.response;

  const upstreamPath = `/api/v1/ops/gallery/submissions/${encodeURIComponent(trimmed)}/audio`;
  const target = buildUpstreamRequestUrl(base.baseUrl, upstreamPath, request.url);

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'manual',
      headers: { 'x-ops-key': opsKey },
    });
    return toProxiedNextResponse(upstream);
  } catch (e) {
    return upstreamFetchErrorResponse(e);
  }
}
