'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { track } from '@/lib/analytics';
import type { AnalyticsSurface } from '@/lib/analytics-events';
import type { ResultVariant } from '@/lib/result-variants';

interface CaptionPanelProps {
  variant: ResultVariant;
  /** Analytics surface to attribute caption copies to. Defaults to "report". */
  surface?: Extract<AnalyticsSurface, 'report' | 'share'>;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Pre-written share captions.
 *
 * The product strategy is explicit: most users are not creators, so the
 * platform should hand them ready-to-send copy. We render the variant\u2019s
 * five captions as numbered "advisories", each with its own inline copy
 * button. The first card is visually elevated so the eye lands on the
 * strongest line.
 */
export const CaptionPanel: FC<CaptionPanelProps> = ({ variant, surface = 'report' }) => (
  <motion.section
    key={variant.id + '-captions'}
    initial="hidden"
    animate="visible"
    variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
    className="mx-auto w-full max-w-7xl px-6 pb-16 pt-4 lg:px-10 lg:pb-20"
  >
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.45, ease: EASE }}
      className="mb-6 flex items-center gap-3"
    >
      <span className="brand-rule h-px w-8 opacity-90" />
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        §04
      </span>
      <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        PRE-WRITTEN ADVISORIES
      </span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
        SUGGESTED CAPTIONS · TAP TO COPY
      </span>
    </motion.div>

    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {variant.captions.map((line, i) => (
        <motion.li
          key={line}
          variants={fadeUp}
          transition={{ duration: 0.45, ease: EASE }}
          className={[
            'group/card relative flex flex-col gap-4 rounded-md border bg-[var(--bg-panel)] p-5',
            i === 0
              ? 'border-[var(--border-brass)] sm:col-span-2'
              : 'border-[var(--border-subtle)]',
          ].join(' ')}
        >
          <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent-brass)]">№ {String(i + 1).padStart(2, '0')}</span>
              <span aria-hidden="true" className="h-2.5 w-px bg-[var(--border-subtle)]" />
              <span>ADVISORY {i === 0 ? '· FEATURED' : ''}</span>
            </div>
            <CopyButton
              text={line}
              onCopy={() =>
                track('caption_copied', {
                  surface,
                  variantId: variant.id,
                  captionIndex: i,
                })
              }
            />
          </div>

          <p
            className={[
              'leading-snug text-[var(--text-strong)]',
              i === 0 ? 'font-display text-[1.55rem] italic sm:text-[1.8rem]' : 'text-[0.98rem]',
            ].join(' ')}
          >
            {`\u201C${line}\u201D`}
          </p>

          <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            <span>{variant.classification.toUpperCase()}</span>
            <span>{variant.captions.length - 1 === i ? 'END OF LIST' : 'CONTINUE'}</span>
          </div>
        </motion.li>
      ))}
    </ul>
  </motion.section>
);

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
