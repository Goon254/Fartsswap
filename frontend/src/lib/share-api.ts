import type { CreateShareLinkResponseDto } from '@/lib/farts-api-types';
import { assertOk } from '@/lib/report-from-recording-api';

export interface CreateReportShareLinkOptions {
  contentType?: string;
}

export async function createReportShareLink(
  reportId: string,
  body?: BodyInit | null,
  options?: CreateReportShareLinkOptions,
): Promise<CreateShareLinkResponseDto> {
  const id = reportId.trim();
  if (!id) throw new Error('Missing report id');

  const headers: Record<string, string> = {};
  if (options?.contentType) headers['content-type'] = options.contentType;

  const res = await fetch(`/api/reports/${encodeURIComponent(id)}/shares`, {
    method: 'POST',
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    body: body ?? undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<CreateShareLinkResponseDto>(res);
}
