'use client';

import { AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnalysisSequence } from '@/components/AnalysisSequence';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { CaptureChamber } from '@/components/CaptureChamber';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { IntakeChoicePanel } from '@/components/IntakeChoicePanel';
import { Navbar } from '@/components/Navbar';
import { pageView, track } from '@/lib/analytics';
import {
  parseChallengeFromSearchParams,
  serializeChallenge,
  type Challenge,
} from '@/lib/challenge';
import { getRandomVariant } from '@/lib/result-variants';

type Step = 'intake' | 'capture' | 'analysis';
type Path = 'record' | 'fake';

/**
 * Client state machine that bridges the landing page and /report.
 *
 *   intake  ─ "record" ─►  capture  ─►  analysis  ─►  /report?variant=…
 *           ─  "fake"  ──────────────►  analysis  ─►  /report?variant=…
 *
 * Variant selection rules:
 *   - "fake" path  : roll a random variant on intake choice.
 *   - "record" path: roll a random variant when capture completes (the
 *     fake "analysis" of fake audio still has to produce some dossier).
 *
 * URL handling:
 *   The landing page links to /analyze?path=record|fake to skip straight
 *   to the right initial step. The query is read once on mount; further
 *   transitions are in-memory only.
 */
export function AnalyzeFlowClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPath = readPath(searchParams.get('path'));

  const [step, setStep] = useState<Step>(stepFor(initialPath));
  const [chosenVariantId, setChosenVariantId] = useState<string | null>(() =>
    initialPath === 'fake' ? getRandomVariant().id : null,
  );

  // Parse any challenge context the user is carrying through the funnel.
  // Captured once on mount so a switch to soft-navigation can't drop it.
  const challengeRef = useRef<Challenge | null>(null);
  if (challengeRef.current === null) {
    // useRef lazy-init pattern: only parse once per mount.
    challengeRef.current = parseChallengeFromSearchParams(searchParams);
  }

  // Fire the page-view exactly once with whichever step we landed on.
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    pageView('analyze_view', { initialStep: step, pathParam: initialPath });
    // For a deep-link landing straight on analysis, count that as
    // analysis_started immediately so the funnel doesn't lose the beat.
    if (step === 'analysis') {
      track('analysis_started', { path: initialPath, variantId: chosenVariantId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // — Track how long the analysis runs so the completion event can carry
  //   an elapsedMs figure useful for tuning the dramatic-pause length. —
  const analysisStartedAtRef = useRef<number | null>(null);

  // — Step transitions —
  const onChoosePath = useCallback((path: Path) => {
    track('intake_path_selected', { path });
    if (path === 'fake') {
      const next = getRandomVariant();
      setChosenVariantId(next.id);
      setStep('analysis');
      track('analysis_started', { path: 'fake', variantId: next.id });
      analysisStartedAtRef.current = performance.now();
    } else {
      setStep('capture');
    }
  }, []);

  const onCaptureComplete = useCallback(() => {
    const next = getRandomVariant();
    setChosenVariantId(next.id);
    setStep('analysis');
    track('analysis_started', { path: 'record', variantId: next.id });
    analysisStartedAtRef.current = performance.now();
  }, []);

  const onCaptureBack = useCallback(() => {
    setStep('intake');
  }, []);

  const onAnalysisComplete = useCallback(() => {
    const target = chosenVariantId ?? getRandomVariant().id;
    const startedAt = analysisStartedAtRef.current ?? performance.now();
    track('analysis_completed', {
      variantId: target,
      elapsedMs: Math.round(performance.now() - startedAt),
    });

    // Forward challenge context (if any) into the report URL so the
    // dossier page can show comparative framing later. Even though /report
    // doesn't act on it yet, the analytics handoff fires here so we can
    // measure how often a challenge actually completes the loop.
    const params = new URLSearchParams({ variant: target });
    const challenge = challengeRef.current;
    if (challenge) {
      const cParams = serializeChallenge(challenge);
      cParams.forEach((value, key) => params.set(key, value));
      track('challenge_context_forwarded', {
        challengeId: challenge.challengeId,
        sourceVariantId: challenge.sourceVariantId,
        sourceScore: challenge.sourceScore,
        targetSurface: 'report',
      });
    }
    router.push(`/report?${params.toString()}`);
  }, [router, chosenVariantId]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'intake' ? (
              <IntakeChoicePanel key="intake" onChoose={onChoosePath} />
            ) : null}
            {step === 'capture' ? (
              <CaptureChamber
                key="capture"
                onBack={onCaptureBack}
                onComplete={onCaptureComplete}
                onCaptureStarted={() => track('capture_started', {})}
                onCaptureCompleted={(info) => track('capture_completed', info)}
                onCaptureRestarted={() => track('capture_restarted', {})}
                onCaptureCancelled={(info) => track('capture_cancelled', info)}
              />
            ) : null}
            {step === 'analysis' ? (
              <AnalysisSequence key="analysis" onComplete={onAnalysisComplete} />
            ) : null}
          </AnimatePresence>
        </main>
        <FooterLoreStrip />
      </div>
    </>
  );
}

function readPath(value: string | null): Path | null {
  if (value === 'record' || value === 'fake') return value;
  return null;
}

function stepFor(path: Path | null): Step {
  if (path === 'fake') return 'analysis';
  if (path === 'record') return 'capture';
  return 'intake';
}
