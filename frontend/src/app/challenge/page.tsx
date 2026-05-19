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
