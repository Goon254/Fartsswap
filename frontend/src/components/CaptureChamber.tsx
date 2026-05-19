'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { LiveCaptureWaveform } from '@/components/LiveCaptureWaveform';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { ProgressDial } from '@/components/ProgressDial';

type ChamberState = 'STANDBY' | 'ARMED' | 'RECORDING' | 'COMPLETE';

export type CaptureChamberMode = 'live' | 'simulated';

export type CaptureCompletedPayload = {
  elapsedMs: number;
  method: CaptureChamberMode;
  blob?: Blob;
  mimeType?: string;
  durationSeconds?: number;
  /** How the capture ended (timer vs early stop). */
  stopReason?: 'timer' | 'manual_stop';
};

interface CaptureChamberProps {
  mode?: CaptureChamberMode;
  onBack: () => void;
  onComplete: () => void;
  /** Fired when the user taps "Begin Capture". */
  onCaptureStarted?: () => void;
  /** Fired when the recording finishes (auto timer or manual stop). */
  onCaptureCompleted?: (info: CaptureCompletedPayload) => void;
  /** Fired when the user resets after a complete capture. */
  onCaptureRestarted?: () => void;
  /** Fired when the user cancels during ARMED / RECORDING. */
  onCaptureCancelled?: (info: { phase: 'armed' | 'recording' }) => void;
}

const DURATION_MS = 10_000;

function pickSupportedMimeType(): string | null {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm'];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return null;
}

/**
 * Step 2A — Recording chamber.
 *
 * State machine:
 *   STANDBY     → user taps "Begin Capture"
 *   ARMED       → ~600ms warmup (status badge "ARMED" + breathing halo)
 *   RECORDING   → 10s countdown OR user taps "Stop" → state COMPLETE
 *   COMPLETE    → "Continue → Analyze" CTA appears
 *
 * `simulated` mode preserves the milestone fake flow (no microphone).
 * `live` mode uses getUserMedia + MediaRecorder (Chrome/Chromium v1).
 */
export const CaptureChamber: FC<CaptureChamberProps> = ({
  mode = 'simulated',
  onBack,
  onComplete,
  onCaptureStarted,
  onCaptureCompleted,
  onCaptureRestarted,
  onCaptureCancelled,
}) => {
  const [state, setState] = useState<ChamberState>('STANDBY');
  const [progress, setProgress] = useState(0);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const armedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const chosenMimeTypeRef = useRef<string | null>(null);
  const finalizingRef = useRef(false);

  const releaseMedia = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // already stopped
      }
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    chunksRef.current = [];
    chosenMimeTypeRef.current = null;
  }, []);

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const emitCaptureCompleted = useCallback(
    (info: CaptureCompletedPayload) => {
      onCaptureCompleted?.(info);
    },
    [onCaptureCompleted],
  );

  const finishSimulatedCapture = useCallback(
    (stopReason: 'timer' | 'manual_stop', elapsedMs: number) => {
      if (finalizingRef.current) return;
      finalizingRef.current = true;
      cancelRaf();
      setProgress(1);
      setState('COMPLETE');
      emitCaptureCompleted({
        elapsedMs,
        method: 'simulated',
        stopReason,
      });
    },
    [cancelRaf, emitCaptureCompleted],
  );

  const finishLiveCapture = useCallback(
    (stopReason: 'timer' | 'manual_stop') => {
      if (finalizingRef.current) return;
      finalizingRef.current = true;
      cancelRaf();

      const recorder = mediaRecorderRef.current;
      const mimeType = chosenMimeTypeRef.current;
      const elapsedMs = recordingStartedAtRef.current
        ? Math.round(performance.now() - recordingStartedAtRef.current)
        : 0;
      const durationSeconds = Math.min(10, Math.max(0.1, elapsedMs / 1000));

      const completeWithBlob = () => {
        const type = mimeType ?? 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        releaseMedia();
        setProgress(1);
        setState('COMPLETE');
        emitCaptureCompleted({
          elapsedMs,
          method: 'live',
          blob,
          mimeType: type,
          durationSeconds,
          stopReason,
        });
      };

      if (!recorder || recorder.state === 'inactive') {
        if (!mimeType || chunksRef.current.length === 0) {
          finalizingRef.current = false;
          setCaptureError('Recording failed before any audio was captured. Please try again.');
          releaseMedia();
          setProgress(0);
          setState('STANDBY');
          return;
        }
        completeWithBlob();
        return;
      }

      recorder.addEventListener(
        'stop',
        () => {
          if (chunksRef.current.length === 0) {
            finalizingRef.current = false;
            setCaptureError('No audio was captured. Check your microphone and try again.');
            releaseMedia();
            setProgress(0);
            setState('STANDBY');
            return;
          }
          completeWithBlob();
        },
        { once: true },
      );

      try {
        recorder.stop();
      } catch {
        finalizingRef.current = false;
        setCaptureError('Could not stop the recorder. Please try again.');
        releaseMedia();
        setProgress(0);
        setState('STANDBY');
      }
    },
    [cancelRaf, emitCaptureCompleted, releaseMedia],
  );

  // — Cleanup on unmount —
  useEffect(
    () => () => {
      if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
      cancelRaf();
      releaseMedia();
    },
    [cancelRaf, releaseMedia],
  );

  // — Simulated RECORDING: rAF progress only —
  useEffect(() => {
    if (state !== 'RECORDING' || mode !== 'simulated') return;

    recordingStartedAtRef.current = performance.now();
    finalizingRef.current = false;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      finishSimulatedCapture('timer', 0);
      return;
    }

    startedAtRef.current = performance.now();
    const tick = (now: number) => {
      const startedAt = startedAtRef.current ?? now;
      const elapsed = now - startedAt;
      const p = Math.min(1, elapsed / DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        finishSimulatedCapture('timer', Math.round(elapsed));
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelRaf();
    };
  }, [state, mode, finishSimulatedCapture, cancelRaf]);

  // — Live RECORDING: mic + MediaRecorder + rAF progress —
  useEffect(() => {
    if (state !== 'RECORDING' || mode !== 'live') return;

    let cancelled = false;
    recordingStartedAtRef.current = performance.now();
    finalizingRef.current = false;
    setCaptureError(null);

    if (typeof MediaRecorder === 'undefined') {
      setCaptureError(
        'This browser does not support audio recording. Use Chrome or Chromium to record.',
      );
      setProgress(0);
      setState('STANDBY');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCaptureError(
        'Microphone capture is not available in this browser or context (use HTTPS).',
      );
      setProgress(0);
      setState('STANDBY');
      return;
    }

    const mimeType = pickSupportedMimeType();
    if (!mimeType) {
      setCaptureError(
        'This browser does not support WebM audio recording. Use Chrome or Chromium to record.',
      );
      setProgress(0);
      setState('STANDBY');
      return;
    }
    const recordingMime = mimeType;
    chosenMimeTypeRef.current = recordingMime;

    async function startLiveRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;

        const recorder = new MediaRecorder(stream, { mimeType: recordingMime });
        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onerror = () => {
          if (cancelled || finalizingRef.current) return;
          setCaptureError('Microphone recording failed. Please try again.');
          releaseMedia();
          setProgress(0);
          setState('STANDBY');
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);

        startedAtRef.current = performance.now();
        const tick = (now: number) => {
          if (cancelled || finalizingRef.current) return;
          const startedAt = startedAtRef.current ?? now;
          const elapsed = now - startedAt;
          const p = Math.min(1, elapsed / DURATION_MS);
          setProgress(p);
          if (p >= 1) {
            finishLiveCapture('timer');
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        if (cancelled) return;
        const denied =
          e instanceof DOMException &&
          (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError');
        setCaptureError(
          denied
            ? 'Microphone access was denied. Allow the microphone in your browser settings, then try again.'
            : 'Could not access the microphone. Check your device and try again.',
        );
        releaseMedia();
        setProgress(0);
        setState('STANDBY');
      }
    }

    void startLiveRecording();

    return () => {
      cancelled = true;
      cancelRaf();
      if (!finalizingRef.current) {
        releaseMedia();
      }
    };
  }, [state, mode, finishLiveCapture, cancelRaf, releaseMedia]);

  const onBegin = useCallback(() => {
    setCaptureError(null);
    finalizingRef.current = false;
    setProgress(0);
    setState('ARMED');
    onCaptureStarted?.();
    armedTimerRef.current = setTimeout(() => setState('RECORDING'), 600);
  }, [onCaptureStarted]);

  const onStop = useCallback(() => {
    const elapsedMs = recordingStartedAtRef.current
      ? Math.round(performance.now() - recordingStartedAtRef.current)
      : 0;
    if (mode === 'simulated') {
      finishSimulatedCapture('manual_stop', elapsedMs);
    } else {
      finishLiveCapture('manual_stop');
    }
  }, [mode, finishSimulatedCapture, finishLiveCapture]);

  const onReset = useCallback(() => {
    cancelRaf();
    if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
    finalizingRef.current = false;
    releaseMedia();
    if (state === 'ARMED' || state === 'RECORDING') {
      onCaptureCancelled?.({ phase: state === 'ARMED' ? 'armed' : 'recording' });
    } else if (state === 'COMPLETE') {
      onCaptureRestarted?.();
    }
    setCaptureError(null);
    setProgress(0);
    setState('STANDBY');
  }, [state, onCaptureCancelled, onCaptureRestarted, cancelRaf, releaseMedia]);

  const secondsRemaining = Math.max(0, Math.ceil((1 - progress) * 10));
  const recording = state === 'RECORDING';
  const armed = state === 'ARMED';
  const complete = state === 'COMPLETE';

  const systemMessage =
    captureError ??
    (mode === 'live' && state === 'STANDBY' && !captureError
      ? 'Live capture uses your microphone. Up to ten seconds per sample.'
      : SYSTEM_MESSAGES[state]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-10 lg:pt-12"
    >
      {/* — Eyebrow / chamber id — */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
              §02
            </span>
            <span>RECORDING CHAMBER · CHAMBER-3</span>
          </div>
          <h1 className="mt-4 max-w-[20ch] font-display text-[2.4rem] font-medium leading-[1.02] tracking-tight text-[var(--text-strong)] sm:text-[3rem] md:text-[3.4rem]">
            {mode === 'live' ? 'Record your specimen.' : 'Simulated capture.'}
          </h1>
          <p className="mt-4 max-w-[52ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
            {mode === 'live'
              ? 'Up to ten seconds of live audio. One clear emission — the Bureau issues a persisted dossier with private replay.'
              : 'Demo chamber — no microphone. Proceed to a synthetic dossier preview.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={recording ? 'red' : armed ? 'amber' : complete ? 'green' : 'neutral'} withDot>
            {state}
          </Chip>
          <Chip tone="brass">10s MAX</Chip>
        </div>
      </div>

      {/* — Dial + waveform — */}
      <div className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-14">
        <div className="mx-auto">
          <ProgressDial
            progress={complete ? 1 : progress}
            pulsing={armed || recording}
            size={320}
            className="select-none"
          >
            <DialCore
              state={state}
              secondsRemaining={secondsRemaining}
            />
          </ProgressDial>
        </div>

        <div className="flex flex-col gap-6">
          <LiveCaptureWaveform active={recording || armed} frozen={complete} bars={56} />

          {/* — System messages — */}
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-4">
            <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              SYSTEM
            </div>
            <div className="mt-1 min-h-[1.4rem] text-sm text-[var(--text-default)]" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={systemMessage}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {systemMessage}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* — CTAs — */}
          <div className="flex flex-wrap items-center gap-3">
            {state === 'STANDBY' ? (
              <>
                <Button variant="primary" onClick={onBegin} trailing={<RecordDot />}>
                  {mode === 'live' ? 'Start recording' : 'Begin capture'}
                </Button>
                <Button variant="ghost" onClick={onBack}>
                  Back
                </Button>
              </>
            ) : null}
            {state === 'ARMED' ? (
              <Button variant="secondary" onClick={onReset}>
                Cancel
              </Button>
            ) : null}
            {state === 'RECORDING' ? (
              <>
                <Button variant="secondary" onClick={onStop}>
                  Stop early
                </Button>
                <Button variant="ghost" onClick={onReset}>
                  Cancel
                </Button>
              </>
            ) : null}
            {state === 'COMPLETE' ? (
              <>
                <Button variant="primary" onClick={onComplete} trailing={<Arrow />}>
                  Issue dossier →
                </Button>
                <Button variant="ghost" onClick={onReset}>
                  Re-capture
                </Button>
              </>
            ) : null}
          </div>

          <PrivacyNotice variant="compact" />
        </div>
      </div>
    </motion.section>
  );
};

const SYSTEM_MESSAGES: Record<ChamberState, string> = {
  STANDBY: 'Awaiting submission. Press "Begin Capture" when ready.',
  ARMED: 'Chamber armed. Hold your position.',
  RECORDING: 'Capturing acoustic sample. Maximum duration ten seconds.',
  COMPLETE: 'Sample buffered. Ready for analysis.',
};

const DialCore: FC<{ state: ChamberState; secondsRemaining: number }> = ({
  state,
  secondsRemaining,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 px-8 text-center">
    <div className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      STATION OPS-04
    </div>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        className="font-display text-[1.7rem] tracking-tight text-[var(--text-strong)]"
      >
        {state === 'STANDBY' ? 'STANDBY' : null}
        {state === 'ARMED' ? 'ARMED' : null}
        {state === 'RECORDING' ? (
          <span>
            {String(secondsRemaining).padStart(2, '0')}
            <span className="ml-0.5 font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--text-muted)]">s</span>
          </span>
        ) : null}
        {state === 'COMPLETE' ? 'CAPTURE COMPLETE' : null}
      </motion.div>
    </AnimatePresence>
    <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
      AGD-301 · INTAKE
    </div>
    {/* small breathing dot mirrors the chip state */}
    <span className="mt-1 flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
      <span
        aria-hidden="true"
        className={[
          'inline-block h-1.5 w-1.5 rounded-full',
          state === 'RECORDING'
            ? 'bg-[var(--color-alert-red)]'
            : state === 'ARMED'
              ? 'bg-[var(--color-alert-amber)]'
              : state === 'COMPLETE'
                ? 'bg-[var(--color-alert-green)]'
                : 'bg-[var(--text-faint)]',
        ].join(' ')}
      />
      {state === 'RECORDING' ? 'LIVE' : state === 'COMPLETE' ? 'BUFFERED' : state}
    </span>
  </div>
);

const RecordDot: FC = () => (
  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-alert-red)]" />
);

const Arrow: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path
      d="M1 7h11M8 3l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    />
  </svg>
);
