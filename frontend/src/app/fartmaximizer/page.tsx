import type { Metadata } from 'next';
import { FartmaximizerLabClient } from '@/components/FartmaximizerLabClient';

export const metadata: Metadata = {
  title: 'Fartmaximizer™ Lab · Meal Matrix Rankings',
  description:
    'Community-powered leaderboard of the most toxic meal combinations. Vote, submit, and review DEFCON 1 attestations filed with the Bureau of Acoustic Gasology.',
};

/**
 * `/fartmaximizer` — public meal-combination leaderboard (client-side votes).
 */
export default function FartmaximizerPage() {
  return <FartmaximizerLabClient />;
}
