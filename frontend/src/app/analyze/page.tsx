import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AnalyzeFlowClient } from '@/components/AnalyzeFlowClient';

export const metadata: Metadata = {
  title: 'Bureau Intake Terminal',
  description:
    'Submit a captured sample or generate a synthetic one. The Bureau will issue a full classification dossier within ten seconds.',
};

/**
 * /analyze — the multistep intake → capture → analysis flow.
 *
 * Read of `?path=` happens inside the client component via
 * `useSearchParams()`, which Next 15 requires to sit under a Suspense
 * boundary. The fallback is intentionally null — the client component
 * renders the intake step instantly with sensible defaults.
 */
export default function AnalyzePage() {
  return (
    <Suspense fallback={null}>
      <AnalyzeFlowClient />
    </Suspense>
  );
}
