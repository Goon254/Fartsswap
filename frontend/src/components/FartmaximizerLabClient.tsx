'use client';

import Link from 'next/link';
import type { FC } from 'react';
import { AnalyticsPageView } from '@/components/analytics/AnalyticsPageView';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { FartmaximizerAmbience } from '@/components/fartmaximizer/FartmaximizerAmbience';
import { FartmaximizerLab } from '@/components/FartmaximizerLab';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';

/**
 * `/fartmaximizer` — community meal-combination leaderboard.
 */
export const FartmaximizerLabClient: FC = () => (
  <>
    <AnalyticsPageView event="fartmaximizer_view" payload={{}} />
    <BackgroundLayers />
    <FartmaximizerAmbience />

    <div className="relative z-10 flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 pt-6 lg:px-10 lg:pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--accent-brass)] underline-offset-2 transition-colors hover:text-[var(--color-brass-400)] hover:underline"
          >
            <span aria-hidden="true">←</span>
            Bureau intake
          </Link>
        </div>
        <FartmaximizerLab standalone />
      </main>

      <FooterLoreStrip />
    </div>
  </>
);
