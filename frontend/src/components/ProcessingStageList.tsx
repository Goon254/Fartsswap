'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';

export interface ProcessingStage {
  /** Six-character institutional code shown beside the title. */
  code: string;
  /** Sentence-case stage title. */
  title: string;
  /** Tiny secondary line under the title; one beat of extra flavour. */
  detail: string;
}

interface ProcessingStageListProps {
  stages: readonly ProcessingStage[];
  /** Index of the currently active stage. -1 if none active yet. */
  activeIndex: number;
  /** When true, every stage shows as complete. */
  finished?: boolean;
}

/**
 * Vertical list of analysis stages with their states.
 *
 * Each row owns a small status icon (idle dot / spinning pip / check),
 * the stage code in brass mono, the title in body text, and a sub-line in
 * faint mono. The active row gets a subtle brass left rail so the eye can
 * always find "where we are" in a glance.
 *
 * The actual stage runner lives in `<AnalysisSequence />`; this component
 * is pure presentational.
 */
export const ProcessingStageList: FC<ProcessingStageListProps> = ({
  stages,
  activeIndex,
  finished = false,
}) => (
  <ol className="flex flex-col">
    {stages.map((stage, i) => {
      const isDone = finished || i < activeIndex;
      const isActive = !finished && i === activeIndex;
      return (
        <li
          key={stage.code}
          aria-current={isActive ? 'step' : undefined}
          className={[
            'group/row relative grid grid-cols-[1.25rem_auto_1fr] items-baseline gap-3',
            'border-b border-[var(--border-subtle)] py-3 last:border-b-0',
          ].join(' ')}
        >
          <span
            aria-hidden="true"
            className={[
              'absolute -left-3 top-3 h-5 w-px',
              isActive ? 'bg-[var(--accent-brass)]' : 'bg-transparent',
            ].join(' ')}
          />
          <span className="flex h-4 items-center justify-center">
            <StageIcon state={isDone ? 'done' : isActive ? 'active' : 'idle'} />
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            {stage.code}
          </span>
          <div>
            <div
              className={[
                'text-[0.95rem] leading-snug transition-colors duration-200',
                isDone
                  ? 'text-[var(--text-muted)] line-through decoration-[var(--text-faint)]'
                  : isActive
                    ? 'text-[var(--text-strong)]'
                    : 'text-[var(--text-default)]',
              ].join(' ')}
            >
              {stage.title}
            </div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              {stage.detail}
            </div>
          </div>
        </li>
      );
    })}
  </ol>
);

const StageIcon: FC<{ state: 'idle' | 'active' | 'done' }> = ({ state }) => {
  if (state === 'done') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="5.4" stroke="var(--accent-teal)" strokeWidth="0.8" fill="none" />
        <path
          d="M3.5 6.3 L5.2 8 L8.7 4.4"
          stroke="var(--accent-teal)"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="square"
        />
      </svg>
    );
  }
  if (state === 'active') {
    return (
      <motion.span
        className="block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: 'var(--accent-brass)' }}
        animate={{ scale: [1, 0.6, 1], opacity: [1, 0.55, 1] }}
        transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  }
  return (
    <span
      className="block h-2 w-2 rounded-full border border-[var(--border-stark)]"
      aria-hidden="true"
    />
  );
};
