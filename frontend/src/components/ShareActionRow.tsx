'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Button } from '@/components/Button';

interface ShareActionRowProps {
  /** Called when "Generate another" is clicked. */
  onGenerateAnother: () => void;
  /** Called when "Copy caption" is clicked. */
  onCopyCaption: () => void;
  /**
   * Target href for "Save share card" when navigating to the static share surface.
   * Omit when the parent handles generation (e.g. persisted `reportId` flow).
   */
  shareHref?: string;
  /** Fires when "Save share card" is clicked (analytics + optional generation). */
  onSaveShareCardClick?: () => void;
  /** Disables the share-card control while a generation request is in flight. */
  saveShareCardDisabled?: boolean;
  /** Optional status line shown under the action row (errors, etc.). */
  saveShareCardStatus?: string | null;
  /** When set, renders "Copy share link" (server-backed share mint + clipboard). */
  onCopyShareLink?: () => void;
  /** Disables copy-share-link while the mint/copy request is in flight. */
  shareLinkBusy?: boolean;
  /** Short-lived "Copied" label or error text for copy-share-link. */
  shareLinkStatus?: string | null;
  /** Target href for the "Challenge a friend" button. */
  challengeHref: string;
  /** Fires before navigation when "Challenge a friend" is clicked. */
  onChallengeClick?: () => void;
  /** Target href for the "Upgrade to Official PDF" premium button. */
  premiumHref: string;
  /** Fires before navigation when the premium CTA is clicked (for analytics). */
  onPremiumClick?: () => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Sticky-ish row of share/export actions sitting between the hero and the
 * diagnostic grid. Visually mirrors the case-file ribbon so the page reads
 * as a single instrument-grade form rather than a stack of widgets.
 *
 * Three real CTAs plus one "coming soon" PDF that's intentionally disabled
 * (the data model is there server-side; UI is just waiting for plumbing).
 */
export const ShareActionRow: FC<ShareActionRowProps> = ({
  onGenerateAnother,
  onCopyCaption,
  shareHref,
  onSaveShareCardClick,
  saveShareCardDisabled,
  saveShareCardStatus,
  onCopyShareLink,
  shareLinkBusy,
  shareLinkStatus,
  challengeHref,
  onChallengeClick,
  premiumHref,
  onPremiumClick,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <div
      className={[
        'flex flex-col gap-4 rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_75%,transparent)] px-5 py-4 backdrop-blur-md',
        'md:flex-row md:items-center md:justify-between',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          §03 · DISTRIBUTION
        </span>
        <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
          Issue. Caption. Repeat.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Button
          variant="primary"
          {...(shareHref ? { href: shareHref } : {})}
          type="button"
          disabled={saveShareCardDisabled}
          onClick={onSaveShareCardClick}
          trailing={<Arrow />}
        >
          {saveShareCardDisabled ? 'Generating…' : 'Save share card'}
        </Button>
        <Button
          variant="secondary"
          href={challengeHref}
          onClick={onChallengeClick}
          trailing={<Arrow />}
        >
          Challenge a friend
        </Button>
        <Button variant="secondary" onClick={onCopyCaption}>
          Copy caption
        </Button>
        {onCopyShareLink ? (
          <Button
            variant="secondary"
            type="button"
            disabled={shareLinkBusy}
            onClick={onCopyShareLink}
          >
            {shareLinkBusy ? 'Copying…' : shareLinkStatus === 'Copied' ? 'Copied' : 'Copy share link'}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={onGenerateAnother}>
          Generate another
        </Button>
        <div className="relative">
          <Button
            variant="secondary"
            href={premiumHref}
            onClick={onPremiumClick}
            trailing={<Arrow />}
          >
            Upgrade to Official PDF
          </Button>
          <span className="pointer-events-none absolute -top-2 right-2 rotate-3 rounded-sm border border-[var(--border-brass)] bg-[var(--bg-panel-strong)] px-1.5 py-px font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            EARLY ACCESS
          </span>
        </div>
      </div>
    </div>
    {saveShareCardStatus || shareLinkStatus ? (
      <p
        className={[
          'mt-2 font-mono text-[0.65rem]',
          shareLinkStatus === 'Copied' ? 'text-[var(--accent-brass)]' : 'text-[var(--text-faint)]',
        ].join(' ')}
      >
        {[saveShareCardStatus, shareLinkStatus].filter(Boolean).join(' · ')}
      </p>
    ) : null}
  </motion.section>
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
