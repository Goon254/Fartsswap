import { NextResponse } from 'next/server';
import { forwardOpsRequest } from '@/lib/ops-upstream';

type RouteCtx = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  const tail = path.map((s) => encodeURIComponent(s)).join('/');
  return forwardOpsRequest(request, 'GET', `/api/v1/ops/plans${tail ? `/${tail}` : ''}`);
}

export async function POST(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  const tail = path.map((s) => encodeURIComponent(s)).join('/');
  return forwardOpsRequest(request, 'POST', `/api/v1/ops/plans${tail ? `/${tail}` : ''}`);
}
