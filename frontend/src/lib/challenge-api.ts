import type { ChallengeResponseDto, CreateChallengeBody } from '@/lib/farts-api-types';
import { assertNoContent, assertOk } from '@/lib/report-from-recording-api';
import type { Challenge } from '@/lib/challenge';

export function buildCreateChallengeBody(draft: Challenge, reportId: string): CreateChallengeBody {
  return {
    id: draft.challengeId,
    reportId,
    variantId: draft.sourceVariantId,
    sourceScore: draft.sourceScore,
    challengeType: draft.challengeType,
    sourceSurface: draft.sourceSurface,
    issuedAt: draft.issuedAt,
  };
}

export interface ChallengeRequestOptions {
  contentType?: string;
}

function requireChallengeId(challengeId: string): string {
  const id = challengeId.trim();
  if (!id) throw new Error('Missing challenge id');
  return id;
}

function buildPostHeaders(options?: ChallengeRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {};
  if (options?.contentType) headers['content-type'] = options.contentType;
  return headers;
}

export async function createChallenge(
  body: BodyInit | null,
  options?: ChallengeRequestOptions,
): Promise<ChallengeResponseDto> {
  const headers = buildPostHeaders(options);

  const res = await fetch('/api/challenges', {
    method: 'POST',
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    body: body ?? undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<ChallengeResponseDto>(res);
}

export async function fetchChallengeById(challengeId: string): Promise<ChallengeResponseDto> {
  const id = requireChallengeId(challengeId);

  const res = await fetch(`/api/challenges/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<ChallengeResponseDto>(res);
}

export async function openChallenge(
  challengeId: string,
  body?: BodyInit | null,
  options?: ChallengeRequestOptions,
): Promise<ChallengeResponseDto> {
  const id = requireChallengeId(challengeId);
  const headers = buildPostHeaders(options);

  const res = await fetch(`/api/challenges/${encodeURIComponent(id)}/open`, {
    method: 'POST',
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    body: body ?? undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  await assertNoContent(res);
  return fetchChallengeById(id);
}

export async function resolveChallenge(
  challengeId: string,
  body?: BodyInit | null,
  options?: ChallengeRequestOptions,
): Promise<ChallengeResponseDto> {
  const id = requireChallengeId(challengeId);
  const headers = buildPostHeaders(options);

  const res = await fetch(`/api/challenges/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    body: body ?? undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  await assertNoContent(res);
  return fetchChallengeById(id);
}
