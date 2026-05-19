import type { Metadata } from 'next';
import { FeedPageClient } from '@/components/FeedPageClient';

export const metadata: Metadata = {
  title: 'Public feed · Bureau of Acoustic Gasology',
  description:
    'Opt-in, moderated bulletin of published specimens. Anonymous labels — no accounts or comments.',
};

export default function FeedRoute() {
  return <FeedPageClient />;
}
