import type { Metadata } from 'next';
import { PlansLabClient } from '@/components/PlansLabClient';

export const metadata: Metadata = {
  title: 'Plans Lab',
  description: 'Internal creator plan + entitlement preview (invite-only).',
  robots: { index: false, follow: false },
};

export default function PlansLabPage() {
  return <PlansLabClient />;
}
