import type { Metadata } from 'next';
import { SponsorLabClient } from '@/components/SponsorLabClient';

export const metadata: Metadata = {
  title: 'Sponsor Lab',
  description: 'Internal preview for native ceremonial sponsorship inventory.',
};

export default function SponsorLabPage() {
  return <SponsorLabClient />;
}
