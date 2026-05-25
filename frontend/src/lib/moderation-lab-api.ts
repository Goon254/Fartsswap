import type { GalleryOpsQueueResponse, GallerySubmissionRow } from '@/lib/farts-api-types';

export type ModerationLabHeaders = Record<string, string>;

/** Staff-authenticated audio for moderation queue review (pending or live). */
export function buildModerationSubmissionAudioUrl(submissionId: string): string {
  return `/api/ops/gallery/submissions/${encodeURIComponent(submissionId)}/audio`;
}

async function parseModerateResponse(res: Response): Promise<GallerySubmissionRow> {
  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = JSON.parse(text) as { message?: string | string[] };
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(', ');
    } catch {
      if (text.trim()) message = text.slice(0, 200);
    }
    throw new Error(message);
  }
  return JSON.parse(text) as GallerySubmissionRow;
}

export async function fetchModerationQueue(
  status: string,
  headers: ModerationLabHeaders,
  limit = 50,
): Promise<GalleryOpsQueueResponse> {
  const u = new URL('/api/ops/gallery/queue', window.location.origin);
  u.searchParams.set('status', status);
  u.searchParams.set('limit', String(limit));
  const res = await fetch(u.toString(), { headers, cache: 'no-store', credentials: 'same-origin' });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? 'Please sign in at /ops/login first.'
        : `Could not load queue (${res.status})`,
    );
  }
  return JSON.parse(text) as GalleryOpsQueueResponse;
}

export async function moderateSubmission(
  submissionId: string,
  action: string,
  headers: ModerationLabHeaders,
  notes?: string,
): Promise<GallerySubmissionRow> {
  const res = await fetch(`/api/ops/gallery/submissions/${encodeURIComponent(submissionId)}/moderate`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ action, ...(notes ? { notes } : {}) }),
  });
  return parseModerateResponse(res);
}

/** Approve then publish so the specimen goes live on /feed in one step. */
export async function approveAndPublishSubmission(
  submissionId: string,
  headers: ModerationLabHeaders,
): Promise<GallerySubmissionRow> {
  await moderateSubmission(submissionId, 'approve', headers);
  return moderateSubmission(submissionId, 'publish', headers);
}
