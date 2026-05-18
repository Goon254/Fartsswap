import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShareFlowClient } from '@/components/ShareFlowClient';

export const metadata: Metadata = {
  title: 'Share-Card Export',
  description:
    'A purpose-built 9:16 poster of the diagnostic dossier, optimised for screenshots and downloadable PNG export.',
};

/**
 * /share — share-card preview + PNG export.
 *
 * Reads `?variant=<id>` so the /report page can link in directly. The
 * Suspense boundary is required by Next 15 because ShareFlowClient (via
 * search params) is a client subtree.
 */
interface SharePageProps {
  searchParams?: Promise<{ variant?: string }>;
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = (await searchParams) ?? {};
  const initialVariantId = typeof params.variant === 'string' ? params.variant : null;

  return (
    <Suspense fallback={null}>
      <ShareFlowClient initialVariantId={initialVariantId} />
    </Suspense>
  );
}
