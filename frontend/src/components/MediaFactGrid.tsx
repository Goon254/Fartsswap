'use client';

import { motion } from 'framer-motion';
import { useCallback, type FC } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { MEDIA_FACTS, serializeFact, type MediaFact } from '@/lib/press';

interface MediaFactGridProps {
  onFactInteracted: (factId: string, kind: 'hover' | 'copy') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Press fact sheet.
 *
 * Each cell carries a fact code, a label, a value, and (optionally) a
 * footnote in monospace. The whole grid is a single bordered surface —
 * `gap-px` over a shared border background — so the result reads as a
 * printed fact sheet rather than a card collection.
 *
 * Hover and copy interactions both fire `press_fact_sheet_interacted`
 * through the parent. Hover events use `onPointerEnter` (not Framer's
 * `whileHover`) so they fire on touch-tap as well as mouseover.
 */
export const MediaFactGrid: FC<MediaFactGridProps> = ({ onFactInteracted }) => {
  const onHover = useCallback(
    (factId: string) => () => onFactInteracted(factId, 'hover'),
    [onFactInteracted],
  );
  const onCopy = useCallback(
    (factId: string) => () => onFactInteracted(factId, 'copy'),
    [onFactInteracted],
  );

  return (
    <motion.section
      id="facts"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 lg:px-10"
    >
      <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
          §III
        </span>
        <span>FACT SHEET · MEDIA FACTS</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
        <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
          CLIPBOARD-READY · PER ROW
        </span>
      </header>

      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
        {MEDIA_FACTS.map((fact, i) => (
          <FactCell
            key={fact.id}
            fact={fact}
            position={i}
            onHover={onHover(fact.id)}
            onCopy={onCopy(fact.id)}
          />
        ))}
      </ul>
    </motion.section>
  );
};

interface FactCellProps {
  fact: MediaFact;
  position: number;
  onHover: () => void;
  onCopy: () => void;
}

const FactCell: FC<FactCellProps> = ({ fact, position, onHover, onCopy }) => (
  <li
    onPointerEnter={onHover}
    onFocus={onHover}
    className="group/fact relative flex flex-col gap-1.5 bg-[var(--bg-panel)] px-5 py-4"
  >
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        FACT · {String(position + 1).padStart(2, '0')}
      </span>
      <CopyButton
        text={serializeFact(fact)}
        onCopy={onCopy}
        copiedLabel="COPIED"
      >
        COPY
      </CopyButton>
    </div>
    <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
      {fact.label}
    </div>
    <div className="text-[0.95rem] leading-snug text-[var(--text-strong)]">{fact.value}</div>
    {fact.note ? (
      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        {fact.note}
      </div>
    ) : null}
  </li>
);
