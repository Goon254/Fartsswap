import type { Metadata } from 'next';
import { MethaneIndexClient } from '@/components/MethaneIndexClient';
import { CURRENT_ISSUE } from '@/lib/methane-index';

export const metadata: Metadata = {
  title: `${CURRENT_ISSUE.title} \u00B7 Bulletin \u2116 ${CURRENT_ISSUE.issueNumber}`,
  description:
    'Weekly classification movement, featured acoustic events, and provisional advisories. Filed for national review by the Bureau of Acoustic Gasology.',
};

/**
 * `/methane-index` — public bulletin.
 *
 * Server-side shell. All state and analytics live in `MethaneIndexClient`.
 * The route is statically prerendered; the bulletin is the same for
 * everyone for the duration of the issue.
 */
export default function MethaneIndexRoute() {
  return <MethaneIndexClient />;
}
