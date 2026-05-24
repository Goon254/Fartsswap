import { NextResponse } from 'next/server';
import { forwardOpsRequest } from '@/lib/ops-upstream';

type RouteCtx = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  const tail = path.map((s) => encodeURIComponent(s)).join('/');
  const upstreamPath = `/api/v1/ops/gallery${tail ? `/${tail}` : ''}`;
  return forwardOpsRequest(request, 'GET', upstreamPath);
}

export async function POST(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  const tail = path.map((s) => encodeURIComponent(s)).join('/');
  const upstreamPath = `/api/v1/ops/gallery${tail ? `/${tail}` : ''}`;
  return forwardOpsRequest(request, 'POST', upstreamPath);
}
