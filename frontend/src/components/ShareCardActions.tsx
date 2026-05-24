'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState, type FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import type { ResultVariant } from '@/lib/result-variants';

interface ShareCardActionsProps {
  variant: ResultVariant;
  /** Triggers the PNG export via the parent (which owns the card ref). */
  onDownload: () => Promise<unknown> | void;
  onGenerateAnother: () => void;
  /** Variant id to deep-link into the full dossier at /report. */
  reportHref: string;
  /** Fired after the user copies the featured caption (for analytics). */
  onCopyCaption?: () => void;
  /** Fired before navigation when "Open full dossier" is clicked. */
  onOpenFullDossier?: () => void;
  /** Target href for the "Send to friend" challenge button. */
  challengeHref: string;
  /** Fired before navigation when "Send to friend" is clicked. */
  onChallengeClick?: () => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Outside-the-card controls.
 *
 * Sits beside the share preview on desktop and below it on mobile. None of
 * this UI appears in the exported PNG because the export utility captures
 * only the card node.
 *
 * Behaviour:
 *   - Download PNG       — async; shows a brief "PREPARING…" → "SAVED" cycle.
 *   - Copy caption       — writes the featured caption to the clipboard.
 *   - Open full dossier  — link to /report?variant=…
 *   - Generate another   — parent rotates through variants.
 */
export const ShareCardActions: FC<ShareCardActionsProps> = ({
  variant,
  onDownload,
  onGenerateAnother,
  reportHref,
  onCopyCaption,
  onOpenFullDossier,
  challengeHref,
  onChallengeClick,
}) => {
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'saved' | 'error'>('idle');
  const [copyPhase, setCopyPhase] = useState<'idle' | 'copied'>('idle');

  const onDownloadClick = useCallback(async () => {
    if (phase === 'preparing') return;
    setPhase('preparing');
    try {
      await onDownload();
      setPhase('saved');
      window.setTimeout(() => setPhase('idle'), 1800);
    } catch {
      setPhase('error');
      window.setTimeout(() => setPhase('idle'), 2400);
    }
  }, [onDownload, phase]);

  const onCopyClick = useCallback(async () => {
    const text = variant.captions[0];
    if (!text || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      onCopyCaption?.();
      setCopyPhase('copied');
      window.setTimeout(() => setCopyPhase('idle'), 1800);
    } catch {
      // ignored — clipboard refused
    }
  }, [variant, onCopyCaption]);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.2 }}
      className={[
        'flex flex-col gap-5 rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_75%,transparent)] p-6 backdrop-blur-md',
      ].join(' ')}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
          <span>§04 · DISTRIBUTION</span>
        </div>
        <div className="font-display text-xl leading-tight tracking-tight text-[var(--text-strong)]">
          Issue the artifact.
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-default)]">
          The card on the left is exported at <span className="font-mono text-[var(--text-strong)]">1080 × 1920</span>{' '}
          and optimized for Stories, X, and TikTok.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <DownloadButton phase={phase} onClick={onDownloadClick} />
        <Button variant="secondary" onClick={onCopyClick}>
          <span className="inline-flex items-center gap-2">
            <span>{copyPhase === 'copied' ? 'Caption copied' : 'Copy caption'}</span>
            {copyPhase === 'copied' ? (
              <span aria-hidden="true" className="text-[var(--accent-teal)]">
                <Check />
              </span>
            ) : null}
          </span>
        </Button>
        <Button
          variant="secondary"
          href={challengeHref}
          onClick={onChallengeClick}
          trailing={<Arrow />}
        >
          Send to friend
        </Button>
        <Button
          variant="secondary"
          href={reportHref}
          onClick={onOpenFullDossier}
          trailing={<Arrow />}
        >
          Open full dossier
        </Button>
        <Button variant="ghost" onClick={onGenerateAnother}>
          Generate another
        </Button>
      </div>

      {/* Provenance strip — reinforces "this is a real artifact" */}
      <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-3">
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          CARRIES WITH IMAGE
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-1 text-[0.78rem] text-[var(--text-default)]">
          <li>· Classification + score + threat level</li>
          <li>· Acoustic signature hash (server-controlled)</li>
          <li>· Bureau seal + fartsswap.com watermark</li>
          <li>· One featured advisory line</li>
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip tone="brass">CASE · {variant.caseFile}</Chip>
          <Chip tone="neutral">{variant.classification.toUpperCase()}</Chip>
        </div>
      </div>
    </motion.aside>
  );
};

const DownloadButton: FC<{
  phase: 'idle' | 'preparing' | 'saved' | 'error';
  onClick: () => void;
}> = ({ phase, onClick }) => {
  const label =
    phase === 'preparing'
      ? 'Preparing…'
      : phase === 'saved'
        ? 'Saved to downloads'
        : phase === 'error'
          ? 'Try again'
          : 'Download PNG · 1080×1920';

  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={phase === 'preparing'}
      trailing={
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="inline-flex"
          >
            {phase === 'preparing' ? <Spinner /> : phase === 'saved' ? <Check /> : <DownloadIcon />}
          </motion.span>
        </AnimatePresence>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
};

const Spinner: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="animate-spin">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.25" />
    <path d="M12.5 7 A 5.5 5.5 0 0 1 7 12.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
);

const Check: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M2 7.5 L5.5 11 L12 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="square" />
  </svg>
);

const DownloadIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1 V9 M3 6 L7 10 L11 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" />
    <path d="M2 12 H12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Arrow: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" fill="none" />
  </svg>
);
