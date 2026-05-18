'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { LiveCaptureWaveform } from '@/components/LiveCaptureWaveform';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { ProgressDial } from '@/components/ProgressDial';

type ChamberState = 'STANDBY' | 'ARMED' | 'RECORDING' | 'COMPLETE';

interface CaptureChamberProps {
  onBack: () => void;
  onComplete: () => void;
  /** Fired when the user taps "Begin Capture". */
  onCaptureStarted?: () => void;
  /** Fired when the recording finishes (auto timer or manual stop). */
  onCaptureCompleted?: (info: { elapsedMs: number; method: 'timer' | 'manual_stop' }) => void;
  /** Fired when the user resets after a complete capture. */
  onCaptureRestarted?: () => void;
  /** Fired when the user cancels during ARMED / RECORDING. */
  onCaptureCancelled?: (info: { phase: 'armed' | 'recording' }) => void;
}

/**
 * Step 2A — Fake recording chamber.
 *
 * State machine:
 *   STANDBY     → user taps "Begin Capture"
 *   ARMED       → ~600ms warmup (status badge "ARMED" + breathing halo)
 *   RECORDING   → 10s countdown OR user taps "Stop" → state COMPLETE
 *   COMPLETE    → "Continue → Analyze" CTA appears
 *
 * No real microphone is touched in this milestone. The animation, the
 * progress dial, and the audible-looking waveform sell the illusion. When
 * the real mic flow lands later, this component becomes the host for it
 * and the state machine stays identical.
 *
 * Implementation note: progress is driven by a single rAF loop. We avoid
 * setInterval so the dial stays smooth and we don't drift if the tab
 * deprioritises us.
 */
export const CaptureChamber: FC<CaptureChamberProps> = ({
  onBack,
  onComplete,
  onCaptureStarted,
  onCaptureCompleted,
  onCaptureRestarted,
  onCaptureCancelled,
}) => {
  const [state, setState] = useState<ChamberState>('STANDBY');
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const armedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);

  const DURATION_MS = 10_000;

  // — Cleanup on unmount —
  useEffect(
    () => () => {
      if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // — Drive progress when in RECORDING —
  useEffect(() => {
    if (state !== 'RECORDING') return;
    recordingStartedAtRef.current = performance.now();
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setProgress(1);
      setState('COMPLETE');
      onCaptureCompleted?.({ elapsedMs: 0, method: 'timer' });
      return;
    }
    startedAtRef.current = performance.now();
    const tick = (now: number) => {
      const startedAt = startedAtRef.current ?? now;
      const elapsed = now - startedAt;
      const p = Math.min(1, elapsed / DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        setState('COMPLETE');
        onCaptureCompleted?.({ elapsedMs: Math.round(elapsed), method: 'timer' });
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, onCaptureCompleted]);

  const onBegin = useCallback(() => {
    setProgress(0);
    setState('ARMED');
    onCaptureStarted?.();
    armedTimerRef.current = setTimeout(() => setState('RECORDING'), 600);
  }, [onCaptureStarted]);

  const onStop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const elapsedMs = recordingStartedAtRef.current
      ? Math.round(performance.now() - recordingStartedAtRef.current)
      : 0;
    setState('COMPLETE');
    onCaptureCompleted?.({ elapsedMs, method: 'manual_stop' });
  }, [onCaptureCompleted]);

  const onReset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
    // Distinguish "cancel during capture" from "re-capture after complete"
    // because they correspond to two different events in the schema.
    if (state === 'ARMED' || state === 'RECORDING') {
      onCaptureCancelled?.({ phase: state === 'ARMED' ? 'armed' : 'recording' });
    } else if (state === 'COMPLETE') {
      onCaptureRestarted?.();
    }
    setProgress(0);
    setState('STANDBY');
  }, [state, onCaptureCancelled, onCaptureRestarted]);

  const secondsRemaining = Math.max(0, Math.ceil((1 - progress) * 10));
  const recording = state === 'RECORDING';
  const armed = state === 'ARMED';
  const complete = state === 'COMPLETE';

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
          <h1 className="mt-4 max-w-[18ch] font-display text-[2.4rem] font-medium leading-[1.02] tracking-tight text-[var(--text-strong)] sm:text-[3rem] md:text-[3.4rem]">
            Submit a sample for analysis.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
            The Bureau will capture up to ten seconds of input. Aim for one clear emission. Subsequent
            material will be discarded by the chamber filter.
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
                  key={state}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {SYSTEM_MESSAGES[state]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* — CTAs — */}
          <div className="flex flex-wrap items-center gap-3">
            {state === 'STANDBY' ? (
              <>
                <Button variant="primary" onClick={onBegin} trailing={<RecordDot />}>
                  Begin Capture
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
                  Continue → Analyze
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
