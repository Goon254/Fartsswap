import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PremiumFlowClient } from '@/components/PremiumFlowClient';
import { parsePremiumSource } from '@/lib/premium';
import { getVariantById } from '@/lib/result-variants';

export const metadata: Metadata = {
  title: 'Bureau Certification Services',
  description:
    'Promote your dossier to an archival, printable, ceremonial issue. Official PDF and wall-format certificates, signed and serialised.',
};

/**
 * /premium — premium upsell scaffold.
 *
 * Reads `?variant=<id>` and an optional `?source=<report|share|challenge>`
 * for analytics attribution. Both fall back gracefully: unknown variant
 * ids resolve to the first registered variant (so the page never blanks);
 * unknown source values become `direct`.
 */
interface PremiumPageProps {
  searchParams?: Promise<{ variant?: string; source?: string }>;
}

export default async function PremiumPage({ searchParams }: PremiumPageProps) {
  const params = (await searchParams) ?? {};
  const variant = getVariantById(typeof params.variant === 'string' ? params.variant : null);
  const source = parsePremiumSource(typeof params.source === 'string' ? params.source : null);

  return (
    <Suspense fallback={null}>
      <PremiumFlowClient variant={variant} source={source} />
    </Suspense>
  );
}
