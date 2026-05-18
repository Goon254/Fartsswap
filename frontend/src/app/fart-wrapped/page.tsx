import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FartWrappedClient } from '@/components/FartWrappedClient';

export const metadata: Metadata = {
  title: 'Fart Wrapped · Annual Review · Bureau of Acoustic Gasology',
  description:
    'Personal annual review of a citizen under emissions observation. Issued under §0.1 of the Release Provision. Reissues annually.',
};

/**
 * `/fart-wrapped` — annual ceremonial review.
 *
 * Server-side shell. All state, analytics, and seed-payload parsing live
 * in `FartWrappedClient`. Suspense boundary is required because the
 * orchestrator calls `useSearchParams()` to honour the seed-style
 * subject overrides.
 */
export default function FartWrappedRoute() {
  return (
    <Suspense fallback={null}>
      <FartWrappedClient />
    </Suspense>
  );
}
