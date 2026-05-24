'use client';

import { AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnalysisSequence } from '@/components/AnalysisSequence';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import {
  CaptureChamber,
  type CaptureCompletedPayload,
} from '@/components/CaptureChamber';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { IntakeChoicePanel } from '@/components/IntakeChoicePanel';
import { Navbar } from '@/components/Navbar';
import { pageView, track } from '@/lib/analytics';
import {
  parseChallengeFromSearchParams,
  serializeChallenge,
  type Challenge,
} from '@/lib/challenge';
import { isPersistedChallengeId, resolveChallenge } from '@/lib/challenge-api';
import {
  createReportFromAudio,
  FartsApiError,
  uploadAudio,
} from '@/lib/report-from-recording-api';
import { getRandomVariant } from '@/lib/result-variants';

type Step = 'intake' | 'capture' | 'analysis';
type Path = 'record' | 'fake';

type CaptureMode = 'live' | 'simulated';

type StoredRecording = {
  blob: Blob;
  mimeType: string;
  durationSeconds?: number;
};

function resolveCaptureMode(): CaptureMode {
  return process.env.NEXT_PUBLIC_CAPTURE_MODE === 'simulated' ? 'simulated' : 'live';
}

/**
 * Client state machine that bridges the landing page and /report.
 *
 *   intake  ─ "record" ─►  capture  ─►  analysis  ─►  /report?variant=…
 *           ─  "fake"  ──────────────►  analysis  ─►  /report?variant=…
 *
 * Live record path: upload audio + create report while analysis runs, then
 * redirect when both the animation and network work finish.
 */
export function AnalyzeFlowClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPath = readPath(searchParams.get('path'));
  const captureMode = resolveCaptureMode();

  const [step, setStep] = useState<Step>(stepFor(initialPath));
  const [chosenVariantId, setChosenVariantId] = useState<string | null>(() =>
    initialPath === 'fake' ? getRandomVariant().id : null,
  );
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  /** Live path: upload + create-report still running after the animation finishes. */
  const [archivePending, setArchivePending] = useState(false);

  const challengeRef = useRef<Challenge | null>(null);
  if (challengeRef.current === null) {
    challengeRef.current = parseChallengeFromSearchParams(searchParams);
  }

  const recordingRef = useRef<StoredRecording | null>(null);
  const analysisDoneRef = useRef(false);
  const networkDoneRef = useRef(false);
  const reportIdRef = useRef<string | null>(null);
  const redirectingRef = useRef(false);

  const initialisedRef = useRef(false);
  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    pageView('analyze_view', { initialStep: step, pathParam: initialPath });
    if (step === 'analysis') {
      track('analysis_started', { path: initialPath, variantId: chosenVariantId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analysisStartedAtRef = useRef<number | null>(null);

  const tryRedirect = useCallback(() => {
    if (redirectingRef.current) return;
    if (!analysisDoneRef.current || !networkDoneRef.current) return;

    const variant = chosenVariantId ?? getRandomVariant().id;
    const reportId = reportIdRef.current;

    if (captureMode === 'live' && !reportId) return;

    redirectingRef.current = true;

    const startedAt = analysisStartedAtRef.current ?? performance.now();
    track('analysis_completed', {
      variantId: variant,
      elapsedMs: Math.round(performance.now() - startedAt),
    });

    const params = new URLSearchParams({ variant });
    if (reportId) {
      params.set('reportId', reportId);
    }

    const challenge = challengeRef.current;
    if (challenge) {
      track('challenge_context_forwarded', {
        challengeId: challenge.challengeId,
        sourceVariantId: challenge.sourceVariantId,
        sourceScore: challenge.sourceScore,
        targetSurface: 'report',
      });

      if (
        reportId &&
        isPersistedChallengeId(challenge.challengeId) &&
        captureMode === 'live'
      ) {
        void (async () => {
          try {
            await resolveChallenge(challenge.challengeId, {
              responseReportId: reportId,
              payload: { surface: 'analyze_counter_submission' },
            });
          } catch {
            // Still route to verdict so the user can copy the link.
          }
          const verdictParams = serializeChallenge(challenge);
          verdictParams.set('view', 'verdict');
          router.push(`/challenge?${verdictParams.toString()}`);
        })();
        return;
      }

      const cParams = serializeChallenge(challenge);
      cParams.forEach((value, key) => params.set(key, value));
    }

    router.push(`/report?${params.toString()}`);
  }, [router, chosenVariantId, captureMode]);

  const resetPipelineRefs = useCallback(() => {
    analysisDoneRef.current = false;
    networkDoneRef.current = captureMode === 'simulated';
    reportIdRef.current = null;
    redirectingRef.current = false;
    setArchivePending(false);
  }, [captureMode]);

  const startNetworkPipeline = useCallback(() => {
    if (captureMode === 'simulated') {
      networkDoneRef.current = true;
      tryRedirect();
      return;
    }

    const recording = recordingRef.current;
    if (!recording) {
      setPipelineError('No recording available. Please capture again.');
      setStep('capture');
      return;
    }

    networkDoneRef.current = false;
    reportIdRef.current = null;
    setArchivePending(true);

    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    void (async () => {
      try {
        const upload = await uploadAudio(
          recording.blob,
          recording.mimeType,
          recording.durationSeconds,
        );
        const report = await createReportFromAudio(
          { audioUploadId: upload.id },
          { idempotencyKey },
        );
        reportIdRef.current = report.id;
        networkDoneRef.current = true;
        setArchivePending(false);
        tryRedirect();
      } catch (e) {
        networkDoneRef.current = false;
        reportIdRef.current = null;
        setArchivePending(false);
        const message =
          e instanceof FartsApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Upload or report creation failed';
        setPipelineError(message);
      }
    })();
  }, [captureMode, tryRedirect]);

  const onChoosePath = useCallback(
    (path: Path) => {
      track('intake_path_selected', { path });
      setPipelineError(null);
      if (path === 'fake') {
        const next = getRandomVariant();
        setChosenVariantId(next.id);
        resetPipelineRefs();
        networkDoneRef.current = true;
        setStep('analysis');
        track('analysis_started', { path: 'fake', variantId: next.id });
        analysisStartedAtRef.current = performance.now();
      } else {
        recordingRef.current = null;
        setStep('capture');
      }
    },
    [resetPipelineRefs],
  );

  const onCaptureCompleted = useCallback((info: CaptureCompletedPayload) => {
    track('capture_completed', {
      elapsedMs: info.elapsedMs,
      method: info.stopReason ?? 'timer',
    });
    if (info.method === 'live' && info.blob && info.mimeType) {
      recordingRef.current = {
        blob: info.blob,
        mimeType: info.mimeType,
        durationSeconds: info.durationSeconds,
      };
    } else {
      recordingRef.current = null;
    }
  }, []);

  const onCaptureComplete = useCallback(() => {
    const next = getRandomVariant();
    setChosenVariantId(next.id);
    setPipelineError(null);
    resetPipelineRefs();
    setStep('analysis');
    track('analysis_started', { path: 'record', variantId: next.id });
    analysisStartedAtRef.current = performance.now();
    startNetworkPipeline();
  }, [resetPipelineRefs, startNetworkPipeline]);

  const onCaptureBack = useCallback(() => {
    recordingRef.current = null;
    setPipelineError(null);
    setStep('intake');
  }, []);

  const onAnalysisComplete = useCallback(() => {
    analysisDoneRef.current = true;
    tryRedirect();
  }, [tryRedirect]);

  const onRetryFromAnalysis = useCallback(() => {
    setPipelineError(null);
    recordingRef.current = null;
    resetPipelineRefs();
    setStep('capture');
  }, [resetPipelineRefs]);

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
                mode={captureMode}
                onBack={onCaptureBack}
                onComplete={onCaptureComplete}
                onCaptureStarted={() => track('capture_started', {})}
                onCaptureCompleted={onCaptureCompleted}
                onCaptureRestarted={() => {
                  recordingRef.current = null;
                  track('capture_restarted', {});
                }}
                onCaptureCancelled={(info) => track('capture_cancelled', info)}
              />
            ) : null}
            {step === 'analysis' ? (
              <div key="analysis" className="flex flex-col">
                {pipelineError ? (
                  <div className="mx-auto mb-6 w-full max-w-7xl px-6 lg:px-10">
                    <div className="rounded-md border border-[var(--color-alert-red)]/40 bg-[color-mix(in_oklab,var(--color-alert-red)_12%,transparent)] px-5 py-4">
                      <p className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--color-alert-red)]">
                        Submission failed
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-default)]">{pipelineError}</p>
                      <button
                        type="button"
                        onClick={onRetryFromAnalysis}
                        className="mt-4 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)] underline-offset-2 hover:underline"
                      >
                        Return to capture chamber
                      </button>
                    </div>
                  </div>
                ) : null}
                <AnalysisSequence
                  onComplete={onAnalysisComplete}
                  waitingForArchive={archivePending}
                />
              </div>
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