'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type FC } from 'react';
import { Chip } from '@/components/Chip';
import { LiveCaptureWaveform } from '@/components/LiveCaptureWaveform';
import { ProcessingStageList, type ProcessingStage } from '@/components/ProcessingStageList';
import { ProgressDial } from '@/components/ProgressDial';

interface AnalysisSequenceProps {
  /** Called once the sequence finishes (and any final delay has elapsed). */
  onComplete: () => void;
  /**
   * Live record path: animation finished but upload/report API still in flight.
   * Avoids showing "DOSSIER READY" before the backend has accepted the filing.
   */
  waitingForArchive?: boolean;
}

/**
 * Step 3 — fake but premium processing sequence.
 *
 * Runs `STAGES` in order, advancing every ~700ms (snappier if the user
 * prefers reduced motion). Total runtime is ~4.9s + a 600ms "finalising"
 * beat = ~5.5s, which lines up with the strategy doc's "report in under
 * ten seconds" promise without feeling instantaneous.
 *
 * Architecture:
 *  - A single rAF loop drives the dial's progress, so the ring fills
 *    smoothly between stage swaps.
 *  - Stages themselves advance on a setInterval keyed off `STAGE_MS`.
 *  - On reduced-motion, we collapse everything to a single 1s beat so the
 *    user still sees a transition rather than a hard jump.
 */
export const AnalysisSequence: FC<AnalysisSequenceProps> = ({
  onComplete,
  waitingForArchive = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const STAGE_MS = reduced ? 140 : 700;
    const TOTAL_MS = STAGE_MS * STAGES.length;
    const FINISH_PAUSE_MS = reduced ? 200 : 600;

    startedAtRef.current = performance.now();

    // — Progress dial: smooth across the whole runtime —
    const tick = (now: number) => {
      const startedAt = startedAtRef.current ?? now;
      const p = Math.min(1, (now - startedAt) / TOTAL_MS);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // — Stage swaps —
    let i = 0;
    stageTimerRef.current = setInterval(() => {
      i += 1;
      if (i >= STAGES.length) {
        if (stageTimerRef.current) clearInterval(stageTimerRef.current);
        setActiveIndex(STAGES.length); // past last
        setFinished(true);
        finishTimerRef.current = setTimeout(onComplete, FINISH_PAUSE_MS);
        return;
      }
      setActiveIndex(i);
    }, STAGE_MS);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, [onComplete]);

  const currentStage = STAGES[Math.min(activeIndex, STAGES.length - 1)]!;
  const pct = Math.round(progress * 100);
  const dialTitle = !finished
    ? currentStage.title
    : waitingForArchive
      ? 'Filing with archive'
      : 'DOSSIER READY';
  const dialStatus = !finished ? 'PROCESSING' : waitingForArchive ? 'FILING' : 'ISSUING';

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-10 lg:pt-12"
    >
      {/* — Eyebrow header — */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
              §03
            </span>
            <span>ACOUSTIC ANALYSIS IN PROGRESS</span>
          </div>
          <h1 className="mt-4 max-w-[20ch] font-display text-[2.4rem] font-medium leading-[1.02] tracking-tight text-[var(--text-strong)] sm:text-[3rem] md:text-[3.4rem]">
            FartGPT is reviewing your submission.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
            The Bureau\u2019s diagnostic pipeline runs in seven stages. Do not navigate away. Dossier
            issuance is automatic on completion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={finished && !waitingForArchive ? 'green' : 'amber'} withDot>
            {finished ? (waitingForArchive ? 'FILING' : 'COMPLETE') : 'IN PROGRESS'}
          </Chip>
          <Chip tone="brass">CLASSIFIED PIPELINE</Chip>
        </div>
      </div>

      {/* — Dial + stages — */}
      <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[auto_1fr] lg:gap-14">
        <div className="mx-auto">
          <ProgressDial progress={progress} size={320} pulsing={!finished}>
            <div className="flex flex-col items-center justify-center gap-2 px-8 text-center">
              <div className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                {currentStage.code}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStage.code + (finished ? `-done-${waitingForArchive}` : '')}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                  className="font-display text-[1.3rem] leading-tight text-[var(--text-strong)] max-w-[15ch]"
                >
                  {dialTitle}
                </motion.div>
              </AnimatePresence>
              <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                {String(pct).padStart(2, '0')}% · ETA {finished ? '0s' : `${Math.max(1, Math.ceil((1 - progress) * 5))}s`}
              </div>
              <span className="mt-1 flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                <span
                  aria-hidden="true"
                  className={[
                    'inline-block h-1.5 w-1.5 rounded-full',
                    finished ? 'bg-[var(--color-alert-green)]' : 'bg-[var(--color-alert-amber)]',
                  ].join(' ')}
                />
                {dialStatus}
              </span>
            </div>
          </ProgressDial>
        </div>

        <div className="flex flex-col gap-5">
          {/* signal panel */}
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                AGD-401 · SIGNAL TRACE
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                MONO · 44.1 kHz
              </span>
            </div>
            <LiveCaptureWaveform active={!finished} frozen={finished} bars={72} />
          </div>

          {/* stage list */}
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                PIPELINE · 7 STAGES
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                {Math.min(activeIndex + (finished ? 0 : 1), STAGES.length)} / {STAGES.length}
              </span>
            </div>
            <ProcessingStageList
              stages={STAGES}
              activeIndex={activeIndex}
              finished={finished}
            />
          </div>

          {/* warnings strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-[var(--border-stark)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_85%,transparent)] px-4 py-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
              <span className="text-[var(--accent-brass)]">PIPELINE NOTICE</span>
              <span>Do not refresh the chamber.</span>
            </div>
            <div className="hidden md:inline">Bureau handling · LEVEL 2 · INTERNAL</div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

/**
 * Seven stages, ordered so the visible labels read as an escalating
 * pipeline rather than a flat list. Every code starts with AGD-4xx so the
 * codes themselves feel like a contiguous family on screen.
 */
const STAGES: readonly ProcessingStage[] = [
  {
    code: 'AGD-401',
    title: 'Initializing Bureau intake protocol',
    detail: 'Handshake with Station OPS-04 acknowledged.',
  },
  {
    code: 'AGD-402',
    title: 'Normalizing emission waveform',
    detail: 'Removing chamber bias; centering DC offset.',
  },
  {
    code: 'AGD-403',
    title: 'Cross-referencing acoustic anomaly archive',
    detail: 'Querying The Fart Vault for prior incidents.',
  },
  {
    code: 'AGD-404',
    title: 'Running FartGPT tonal inference',
    detail: 'Bound by refuse-list; PG-13 strictly enforced.',
  },
  {
    code: 'AGD-405',
    title: 'Estimating probable cause matrix',
    detail: 'Twelve candidate causes evaluated; one selected.',
  },
  {
    code: 'AGD-406',
    title: 'Assigning cinematic parallel',
    detail: 'Genre/archetype only \u2014 no titles, no real names.',
  },
  {
    code: 'AGD-407',
    title: 'Finalizing classification dossier',
    detail: 'Generating server-controlled hash and seal.',
  },
];
