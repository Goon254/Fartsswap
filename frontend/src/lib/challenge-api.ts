import type { ChallengeResponseDto, CreateChallengeBody } from '@/lib/farts-api-types';
import { assertNoContent, assertOk } from '@/lib/report-from-recording-api';
import type { Challenge, ChallengeSourceSurface, ChallengeType } from '@/lib/challenge';

const VALID_CHALLENGE_TYPES: readonly ChallengeType[] = [
  'beat_score',
  'rarer_classification',
  'open',
];
const VALID_CHALLENGE_SURFACES: readonly ChallengeSourceSurface[] = ['report', 'share'];

const CHALLENGE_ID_RE = /^ch_[a-zA-Z0-9_-]{1,58}$/;

export function isPersistedChallengeId(challengeId: string): boolean {
  return CHALLENGE_ID_RE.test(challengeId.trim());
}

export function challengeFromResponseDto(dto: ChallengeResponseDto): Challenge {
  const challengeType = dto.challengeType as ChallengeType;
  const sourceSurface = dto.sourceSurface as ChallengeSourceSurface;
  return {
    challengeId: dto.id,
    sourceVariantId: dto.variantId,
    sourceScore: dto.sourceScore,
    issuedAt: dto.issuedAt,
    challengeType: VALID_CHALLENGE_TYPES.includes(challengeType) ? challengeType : 'beat_score',
    sourceSurface: VALID_CHALLENGE_SURFACES.includes(sourceSurface) ? sourceSurface : 'report',
  };
}

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
  if (!isPersistedChallengeId(id)) {
    throw new Error('Invalid persisted challenge id');
  }

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

export interface ResolveChallengeInput {
  responseReportId: string;
  payload?: Record<string, unknown>;
}

export async function resolveChallenge(
  challengeId: string,
  input: ResolveChallengeInput,
  options?: ChallengeRequestOptions,
): Promise<ChallengeResponseDto> {
  const id = requireChallengeId(challengeId);
  const headers = buildPostHeaders({ ...options, contentType: 'application/json' });

  const res = await fetch(`/api/challenges/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      responseReportId: input.responseReportId,
      payload: input.payload,
    }),
    credentials: 'include',
    cache: 'no-store',
  });

  await assertNoContent(res);
  return fetchChallengeById(id);
}

export function buildChallengeChallengerAudioUrl(challengeId: string): string {
  return `/api/challenges/${encodeURIComponent(requireChallengeId(challengeId))}/challenger-audio`;
}

export function buildChallengeResponseAudioUrl(challengeId: string): string {
  return `/api/challenges/${encodeURIComponent(requireChallengeId(challengeId))}/response-audio`;
}
