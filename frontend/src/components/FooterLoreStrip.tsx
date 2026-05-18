'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import { SectionLabel } from '@/components/SectionLabel';
import { Wordmark } from '@/components/Wordmark';
import { fadeUp, staggerParent, transitionBrand } from '@/lib/motion';
import { LORE_TERMS } from '@/lib/data';

/**
 * Footer "lore strip".
 *
 * The four recurring brand terms — FartGPT, The Fart Vault, Methane Index,
 * Fart Court — set in display serif as if they were sections of a real
 * publication. A second strip below carries the Bureau seal, copyright, and
 * a deadpan legal microcopy line.
 */
export const FooterLoreStrip: FC = () => (
  <footer className="relative">
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 lg:px-10">
      <SectionLabel index="III">RECURRING BUREAU LORE</SectionLabel>
      <motion.ul
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4"
      >
        {LORE_TERMS.map((item) => (
          <motion.li
            key={item.term}
            variants={fadeUp}
            transition={transitionBrand}
            className="group/lore relative flex flex-col gap-3 bg-[var(--bg-panel)] p-6"
          >
            <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              ENTRY
            </div>
            <div className="font-display text-2xl tracking-tight text-[var(--text-strong)]">
              {item.term}
            </div>
            <div className="text-sm text-[var(--text-default)]">{item.detail}</div>
            <span
              aria-hidden="true"
              className="absolute right-4 top-4 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)] opacity-40 transition-opacity group-hover/lore:opacity-90"
            >
              SEE ALSO
            </span>
          </motion.li>
        ))}
      </motion.ul>

      {/* — colophon — */}
      <div className="mt-12 grid grid-cols-1 gap-8 border-t border-[var(--border-subtle)] pt-10 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex items-center gap-5">
          <Seal size={56} className="text-[var(--accent-brass)] opacity-90" />
          <div>
            <Wordmark size="md" />
            <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              Bureau of Acoustic Gasology · MMXXVI
            </div>
          </div>
        </div>

        <p className="max-w-[60ch] text-xs leading-relaxed text-[var(--text-muted)] md:px-6">
          Farts.com is a satirical product. No diagnosis is performed; no clinical relationship
          is created; no methane is regulated. All reports are issued under the Bureau&apos;s
          standing Parody Authority. Subject to revision without further dignity.
        </p>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Chip tone="neutral">v0.7 · ALPHA</Chip>
          <Chip tone="green" withDot>
            STATION ONLINE
          </Chip>
        </div>
      </div>
    </div>
  </footer>
);
