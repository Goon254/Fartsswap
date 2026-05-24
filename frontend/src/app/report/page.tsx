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
 * Reads optional `?variant=<id>` and `?reportId=<uuid>` search params for
 * persisted dossiers and share/challenge flows.
 */
interface ReportPageProps {
  searchParams?: Promise<{ variant?: string; reportId?: string }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = (await searchParams) ?? {};
  const initialVariantId = typeof params.variant === 'string' ? params.variant : null;
  const initialReportId = typeof params.reportId === 'string' ? params.reportId : null;

  return (
    <Suspense fallback={null}>
      <ReportResultClient initialVariantId={initialVariantId} initialReportId={initialReportId} />
    </Suspense>
  );
}
