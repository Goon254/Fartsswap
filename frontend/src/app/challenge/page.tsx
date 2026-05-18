import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChallengeFlowClient } from '@/components/ChallengeFlowClient';
import {
  defaultMockChallenge,
  parseChallengeFromSearchParams,
  parseChallengePerspective,
} from '@/lib/challenge';

export const metadata: Metadata = {
  title: 'Acoustic Ruling Under Dispute',
  description:
    'A diagnostic event has been entered into competitive review. Counter-submission authorized.',
};

/**
 * /challenge — challenge link experience.
 *
 * Reads challenge params from the URL on the server, falls back to a
 * deterministic mock when missing/invalid, and hands a fully resolved
 * `Challenge` to the client. The Suspense boundary is required by Next 15
 * for descendants that use `useSearchParams` (we don't currently, but
 * keeping it here means we can adopt that pattern later without a
 * boundary refactor).
 */
interface ChallengePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ChallengePage({ searchParams }: ChallengePageProps) {
  const params = (await searchParams) ?? {};
  const parsed = parseChallengeFromSearchParams(params);
  const challenge = parsed ?? defaultMockChallenge();
  const perspective = parseChallengePerspective(params);

  return (
    <Suspense fallback={null}>
      <ChallengeFlowClient
        challenge={challenge}
        perspective={perspective}
        hasValidParams={parsed !== null}
      />
    </Suspense>
  );
}
