import { AnalyticsPageView } from '@/components/analytics/AnalyticsPageView';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { FeatureGrid } from '@/components/FeatureGrid';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Hero } from '@/components/Hero';
import { LaunchShellClient } from '@/components/LaunchShellClient';
import { Navbar } from '@/components/Navbar';
import { SectionLabel } from '@/components/SectionLabel';
import { LAUNCH_MODE } from '@/lib/launch-mode';

/**
 * Public homepage.
 *
 * Two modes:
 *   - `LAUNCH_MODE=false` → live product landing (Hero + FeatureGrid). Default.
 *   - `LAUNCH_MODE=true`  → pre-launch waitlist shell (LaunchShellClient).
 *
 * The flag lives in `src/lib/launch-mode.ts` and is wired to the
 * `NEXT_PUBLIC_LAUNCH_MODE` env var so CI can flip modes without a code
 * change. The dedicated `/launch` route always renders the launch shell
 * regardless of the flag, so launch packaging can be previewed after the
 * homepage flips to live.
 */
export default function HomePage() {
  if (LAUNCH_MODE) {
    return <LaunchShellClient surface="home" />;
  }
  return <LiveLanding />;
}

/**
 * Pre-existing live landing, preserved verbatim so flipping LAUNCH_MODE
 * off restores the current product surface exactly.
 */
function LiveLanding() {
  return (
    <>
      <AnalyticsPageView event="landing_view" payload={{}} />
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex-1">
          <Hero />

          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <SectionLabel index="II">FIELD PROCEDURE</SectionLabel>
          </div>

          <FeatureGrid />
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
}
