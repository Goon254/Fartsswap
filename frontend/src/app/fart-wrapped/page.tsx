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
 * Server-side shell. `FartWrappedClient` fetches query-backed wrapped data
 * (session cookie, or `?slug=<public_report_slug>`), applies optional seed
 * overrides, and emits typed analytics. Suspense is required for
 * `useSearchParams()`.
 */
export default function FartWrappedRoute() {
  return (
    <Suspense fallback={null}>
      <FartWrappedClient />
    </Suspense>
  );
}
