import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AnalyzeFlowClient } from '@/components/AnalyzeFlowClient';

export const metadata: Metadata = {
  title: 'Record or demo · Bureau Intake',
  description:
    'Record a real fart for a persisted dossier and private replay, or try the no-mic demo. Anonymous, no signup.',
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
