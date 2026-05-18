import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SeedToolClient } from '@/components/SeedToolClient';

export const metadata: Metadata = {
  title: 'Creator Seeding Toolkit · Bureau Dispatch Desk',
  description:
    'Operator console for issuing custom seeded acoustic dossiers. Configure a target, tune the variant, dispatch copy-ready URLs and outreach captions.',
};

/**
 * `/seed` — internal-style creator seeding toolkit.
 *
 * Server-side shell. All state and analytics live in `SeedToolClient`.
 * Suspense boundary is required because the orchestrator reads from
 * search params downstream via the existing surfaces.
 */
export default function SeedRoute() {
  return (
    <Suspense fallback={null}>
      <SeedToolClient />
    </Suspense>
  );
}
