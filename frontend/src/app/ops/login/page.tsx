import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OpsLoginClient } from '@/components/OpsLoginClient';

export const metadata: Metadata = {
  title: 'Staff sign in',
  robots: { index: false, follow: false },
};

export default function OpsLoginPage() {
  return (
    <Suspense fallback={<p className="p-10 font-mono text-sm text-[var(--text-muted)]">Loading…</p>}>
      <OpsLoginClient />
    </Suspense>
  );
}
