import type { Metadata } from 'next';
import { ModerationLabClient } from '@/components/ModerationLabClient';

export const metadata: Metadata = {
  title: 'Moderation Lab',
  description: 'Staff review queue — approve or reject public feed submissions.',
  robots: { index: false, follow: false },
};

export default function ModerationLabPage() {
  return <ModerationLabClient />;
}
