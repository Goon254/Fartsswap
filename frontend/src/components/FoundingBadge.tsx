'use client';

import { motion } from 'framer-motion';
import { useCallback, type FC } from 'react';
import { Seal } from '@/components/Seal';

interface FoundingBadgeProps {
  /** When null, renders the un-issued state ("UN-ISSUED · AWAITING FILING"). */
  founderNumber: string | null;
  /** Optional designation; falls back to "Anonymous founder". */
  designation?: string;
  /** Optional submitted-at ISO; renders as YYYY-MM-DD UTC. */
  submittedAtIso?: string;
  /** Fires on hover and click for analytics; the panel itself is non-navigating. */
  onInteract?: (kind: 'hover' | 'click') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Founding farter badge.
 *
 * Two states: "issued" (post-waitlist-submission) and "un-issued"
 * (pre-submission, encouraging the user to file).
 *
 * Visually: a tall, gold-lit dossier with the Bureau seal centred at the
 * top, the founder number set in display type, a redacted designation
 * row (or the user's actual designation once issued), and a signature
 * line + filing date in the footer.
 *
 * The component is presentational only — the parent owns waitlist
 * state and decides when to swap from un-issued to issued.
 */
export const FoundingBadge: FC<FoundingBadgeProps> = ({
  founderNumber,
  designation,
  submittedAtIso,
  onInteract,
}) => {
  const issued = founderNumber !== null;
  const handleHover = useCallback(() => onInteract?.('hover'), [onInteract]);
  const handleClick = useCallback(() => onInteract?.('click'), [onInteract]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      onMouseEnter={handleHover}
      onFocus={handleHover}
      onClick={handleClick}
      role="img"
      aria-label={
        issued
          ? `Founding farter badge, designation ${designation ?? 'anonymous'}, number ${founderNumber}`
          : 'Founding farter badge, un-issued'
      }
      className={[
        'relative isolate flex flex-col items-center overflow-hidden rounded-md',
        'border border-[var(--border-brass)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_80%,transparent)]',
        'p-7 text-center',
        'shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      {/* Brass top + bottom ruler */}
      <span
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px bg-[var(--accent-brass)] opacity-90"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-6 bottom-0 h-px bg-[var(--accent-brass)] opacity-90"
      />

      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        FOUNDING FARTER · LEDGER
      </div>

      <div className="my-5 text-[var(--accent-brass)]">
        <Seal size={120} className="opacity-95" />
      </div>

      <div className="font-display text-[2.4rem] font-medium leading-none tracking-tight text-[var(--text-strong)]">
        {issued ? <>№ {founderNumber}</> : <>№ &mdash; — —</>}
      </div>
      <div className="mt-1 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        {issued ? 'FOUNDER OF RECORD' : 'AWAITING FILING'}
      </div>

      <div className="mt-5 w-full border-t border-dashed border-[var(--border-brass)] pt-4">
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          DESIGNATION
        </div>
        <div
          className={[
            'mt-1 font-display italic',
            issued ? 'text-[var(--text-default)]' : 'text-[var(--text-faint)]',
          ].join(' ')}
        >
          {issued ? designation ?? 'Anonymous founder' : 'Pending declaration'}
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-2 gap-4 border-t border-dashed border-[var(--border-brass)] pt-4 text-left">
        <div>
          <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            FILED
          </div>
          <div className="mt-0.5 font-mono text-[0.75rem] text-[var(--text-default)]">
            {issued ? formatIso(submittedAtIso) : '— — — —'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            BUREAU
          </div>
          <div className="mt-0.5 font-mono text-[0.75rem] text-[var(--text-default)]">
            B·A·G / §0.1
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function formatIso(iso?: string): string {
  if (!iso) return '— — — —';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} UTC`;
}
