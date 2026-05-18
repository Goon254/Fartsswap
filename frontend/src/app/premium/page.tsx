import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PremiumFlowClient } from '@/components/PremiumFlowClient';
import { parsePremiumSource } from '@/lib/premium';
import { getVariantById } from '@/lib/result-variants';
import { applySeedOverridesToVariant, parseSeedPayload } from '@/lib/seed';

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
 *
 * Honours seed overrides (`?s_target=…&s_score=…`) when present, so
 * certificate previews carry the operator-chosen target name and score.
 */
interface PremiumPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PremiumPage({ searchParams }: PremiumPageProps) {
  const params = (await searchParams) ?? {};
  const variantParam = pickString(params.variant);
  const sourceParam = pickString(params.source);

  const baseVariant = getVariantById(variantParam);
  const seedPayload = parseSeedPayload(params);
  const variant = applySeedOverridesToVariant(baseVariant, seedPayload);
  const source = parsePremiumSource(sourceParam);

  return (
    <Suspense fallback={null}>
      <PremiumFlowClient variant={variant} source={source} />
    </Suspense>
  );
}

function pickString(v: string | string[] | undefined): string | null {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return null;
}
