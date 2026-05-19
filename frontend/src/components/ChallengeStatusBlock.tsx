'use client';

import type { FC } from 'react';
import { Button } from '@/components/Button';
import type { ChallengeReentryStatus } from '@/lib/challenge-reentry';

interface ChallengeStatusBlockProps {
  status: ChallengeReentryStatus;
  onRefresh?: () => void;
  refreshBusy?: boolean;
}

export const ChallengeStatusBlock: FC<ChallengeStatusBlockProps> = ({
  status,
  onRefresh,
  refreshBusy,
}) => {
  const tone =
    status.phase === 'verdict_ready'
      ? 'border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_10%,var(--bg-panel))]'
      : status.phase === 'waiting_for_response'
        ? 'border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)]'
        : 'border-[var(--border-subtle)] bg-[var(--bg-panel)]';

  return (
    <section
      className={[
        'mx-auto w-full max-w-7xl px-6 lg:px-10',
        'rounded-md border px-5 py-4 backdrop-blur-md',
        tone,
      ].join(' ')}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            {status.eyebrow}
          </p>
          <h2 className="mt-1 font-display text-lg text-[var(--text-primary)]">{status.headline}</h2>
          <p className="mt-2 max-w-2xl font-mono text-[0.68rem] leading-relaxed text-[var(--text-muted)]">
            {status.detail}
          </p>
        </div>
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            disabled={refreshBusy}
            onClick={onRefresh}
            className="shrink-0"
          >
            {refreshBusy ? 'Checking…' : 'Check for response'}
          </Button>
        ) : null}
      </div>
    </section>
  );
};
