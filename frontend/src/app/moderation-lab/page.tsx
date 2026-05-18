import type { Metadata } from 'next';
import { ModerationLabClient } from '@/components/ModerationLabClient';

export const metadata: Metadata = {
  title: 'Moderation Lab',
  description: 'Internal gallery review queue — opt-in publication control only.',
  robots: { index: false, follow: false },
};

export default function ModerationLabPage() {
  return <ModerationLabClient />;
}
