'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState, type FC } from 'react';
import { Button } from '@/components/Button';
import type { Challenge, ChallengePerspective } from '@/lib/challenge';

interface ChallengeCtaPanelProps {
  challenge: Challenge;
  perspective: ChallengePerspective;
  /** Where Accept routes to. */
  acceptHref: string;
  /** Where Generate-a-fake-challenger routes to. */
  fakeHref: string;
  /** Where Back / Back-to-dossier routes to. */
  backHref: string;
  /** For sender preview only: the full URL to copy. */
  copyableLink?: string;
  /** Analytics hook — passes the cta name back to the parent. */
  onCtaClicked?: (cta: 'accept' | 'fake' | 'back_to_lab' | 'copy_link') => void;
  /** When set, Accept uses this handler instead of href navigation (persisted resolve flow). */
  onAcceptChallenge?: () => void;
  acceptDisabled?: boolean;
  acceptBusyLabel?: string;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * CTA panel rendered to the right of the rival card.
 *
 * Recipient mode:
 *   Primary  — Accept challenge → /analyze?path=record&… (with forwarded
 *              challenge context)
 *   Secondary — Generate a fake challenger → /analyze?path=fake&…
 *   Ghost    — Back to lab → /
 *
 * Sender mode (?from=mine, opens automatically when issuing a challenge):
 *   Primary  — Copy challenge link (idle / preparing / saved / try-again)
 *   Secondary — Accept it yourself → routes into the same /analyze flow
 *   Ghost    — Back to dossier → /report?variant=…
 *
 * The Copy button mirrors the share-card download button's animated phase
 * states so the visual language is consistent across the lab.
 */
export const ChallengeCtaPanel: FC<ChallengeCtaPanelProps> = ({
  challenge,
  perspective,
  acceptHref,
  fakeHref,
  backHref,
  copyableLink,
  onCtaClicked,
  onAcceptChallenge,
  acceptDisabled,
  acceptBusyLabel,
}) => {
  const [copyPhase, setCopyPhase] = useState<'idle' | 'saved' | 'error'>('idle');

  const onCopy = useCallback(async () => {
    if (!copyableLink) return;
    onCtaClicked?.('copy_link');
    try {
      const fullUrl =
        typeof window !== 'undefined' && copyableLink.startsWith('/')
          ? window.location.origin + copyableLink
          : copyableLink;
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      }
      setCopyPhase('saved');
      window.setTimeout(() => setCopyPhase('idle'), 1800);
    } catch {
      setCopyPhase('error');
      window.setTimeout(() => setCopyPhase('idle'), 2200);
    }
  }, [copyableLink, onCtaClicked]);

  const isSender = perspective === 'sender';

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
      className={[
        'flex flex-col gap-5 rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_75%,transparent)] p-6 backdrop-blur-md',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span>§07 · COUNTER-SUBMISSION</span>
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-default)]">
        {isSender
          ? 'Copy the docket URL and forward it to the nominee. Their counter-submission will be filed automatically beneath your case.'
          : 'Open a recording chamber and produce a counter-submission. Synthetic challengers are accepted; the Bureau does not distinguish.'}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {isSender ? (
          <>
            <CopyButton phase={copyPhase} onClick={onCopy} />
            <AcceptChallengeButton
              variant="secondary"
              acceptHref={acceptHref}
              label={acceptBusyLabel ?? 'Accept it yourself'}
              disabled={acceptDisabled}
              onAcceptChallenge={onAcceptChallenge}
              onCtaClicked={onCtaClicked}
            />
            <Button
              variant="ghost"
              href={backHref}
              onClick={() => onCtaClicked?.('back_to_lab')}
            >
              Back to dossier
            </Button>
          </>
        ) : (
          <>
            <AcceptChallengeButton
              variant="primary"
              acceptHref={acceptHref}
              label={acceptBusyLabel ?? 'Accept challenge'}
              disabled={acceptDisabled}
              onAcceptChallenge={onAcceptChallenge}
              onCtaClicked={onCtaClicked}
            />
            <Button
              variant="secondary"
              href={fakeHref}
              onClick={() => onCtaClicked?.('fake')}
            >
              Generate a fake challenger
            </Button>
            <Button
              variant="ghost"
              href={backHref}
              onClick={() => onCtaClicked?.('back_to_lab')}
            >
              Back to lab
            </Button>
          </>
        )}
      </div>

      {isSender && copyableLink ? (
        <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-3">
          <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            DOCKET URL
          </div>
          <div className="mt-1 break-all font-mono text-[0.7rem] tracking-wide-2 text-[var(--text-default)]">
            {copyableLink}
          </div>
        </div>
      ) : null}

      <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-3 text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          STANDING NOTICE
        </div>
        <p className="mt-1">
          Filed under §6 (Competitive Review). All counter-submissions are advisory.
          The Bureau\u2019s parody authority remains supreme.
        </p>
        <div className="mt-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
          DOCKET · DKT-{challenge.challengeId.replace(/^ch_/, '').slice(0, 4).toUpperCase() || '0000'}
        </div>
      </div>
    </motion.aside>
  );
};

const AcceptChallengeButton: FC<{
  variant: 'primary' | 'secondary';
  acceptHref: string;
  label: string;
  disabled?: boolean;
  onAcceptChallenge?: () => void;
  onCtaClicked?: (cta: 'accept') => void;
}> = ({ variant, acceptHref, label, disabled, onAcceptChallenge, onCtaClicked }) => {
  if (onAcceptChallenge) {
    return (
      <Button
        variant={variant}
        type="button"
        disabled={disabled}
        onClick={() => {
          onAcceptChallenge();
        }}
        trailing={<Arrow />}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      href={acceptHref}
      onClick={() => onCtaClicked?.('accept')}
      trailing={<Arrow />}
    >
      {label}
    </Button>
  );
};

const CopyButton: FC<{
  phase: 'idle' | 'saved' | 'error';
  onClick: () => void;
}> = ({ phase, onClick }) => {
  const label =
    phase === 'saved'
      ? 'Link copied'
      : phase === 'error'
        ? 'Try again'
        : 'Copy challenge link';

  return (
    <Button
      variant="primary"
      onClick={onClick}
      trailing={
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="inline-flex"
          >
            {phase === 'saved' ? <Check /> : <Link />}
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
          transition={{ duration: 0.18, ease: EASE }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
};

const Arrow: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" fill="none" />
  </svg>
);
const Link: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path
      d="M5.5 7a2.5 2.5 0 0 0 0 3.5l1.4 1.4M8.5 7a2.5 2.5 0 0 1 0-3.5l-1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="square"
    />
  </svg>
);
const Check: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M2 7.5 L5.5 11 L12 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="square" />
  </svg>
);
