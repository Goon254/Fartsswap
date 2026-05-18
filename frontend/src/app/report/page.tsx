import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReportResultClient } from '@/components/ReportResultClient';

export const metadata: Metadata = {
  title: 'Report Output',
  description:
    'A classified acoustic diagnostic dossier, issued by the Bureau of Acoustic Gasology under standing parody authority.',
};

/**
 * /report — the result experience.
 *
 * Reads an optional `?variant=<id>` search param so the analyze flow can land
 * the user on a specific dossier without coupling itself to component
 * internals. The Suspense boundary is required by Next 15 whenever a client
 * descendant calls `useSearchParams()`.
 */
interface ReportPageProps {
  searchParams?: Promise<{ variant?: string }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = (await searchParams) ?? {};
  const initialVariantId = typeof params.variant === 'string' ? params.variant : null;

  return (
    <Suspense fallback={null}>
      <ReportResultClient initialVariantId={initialVariantId} />
    </Suspense>
  );
}
