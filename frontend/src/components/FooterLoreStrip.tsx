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
          Fartsswap.com is a satirical product. No diagnosis is performed; no clinical relationship
          is created; no methane is regulated. All reports are issued under the Bureau&apos;s
          standing Parody Authority. Subject to revision without further dignity.
        </p>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <a
            href="https://t.me/fartsswap_community"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join our Community on Telegram"
            className={footerExternalLinkClass('cerulean')}
          >
            <TelegramIcon />
            Telegram
          </a>
          <a
            href="https://buymeacoffee.com/Goon254"
            target="_blank"
            rel="noopener noreferrer"
            className={footerExternalLinkClass('amber')}
          >
            <GasFundIcon />
            Contribute to the Gas Fund
          </a>
          <Chip tone="neutral">v0.7 · ALPHA</Chip>
          <Chip tone="green" withDot>
            STATION ONLINE
          </Chip>
        </div>
      </div>
    </div>
  </footer>
);

const FOOTER_LINK_TONES = {
  cerulean: {
    ring: 'ring-[color-mix(in_oklab,var(--color-alert-cerulean)_45%,transparent)]',
    bg: 'bg-[color-mix(in_oklab,var(--color-alert-cerulean)_10%,transparent)]',
    fg: 'text-[var(--color-alert-cerulean)]',
    hover: 'hover:bg-[color-mix(in_oklab,var(--color-alert-cerulean)_18%,transparent)]',
  },
  amber: {
    ring: 'ring-[color-mix(in_oklab,var(--color-alert-amber)_45%,transparent)]',
    bg: 'bg-[color-mix(in_oklab,var(--color-alert-amber)_10%,transparent)]',
    fg: 'text-[var(--color-alert-amber)]',
    hover: 'hover:bg-[color-mix(in_oklab,var(--color-alert-amber)_18%,transparent)]',
  },
} as const;

function footerExternalLinkClass(tone: keyof typeof FOOTER_LINK_TONES): string {
  const t = FOOTER_LINK_TONES[tone];
  return [
    'inline-flex items-center gap-2 rounded-sm px-2 py-[0.3rem]',
    'font-mono text-[0.62rem] uppercase tracking-wide-3',
    'ring-1 ring-inset',
    t.ring,
    t.bg,
    t.fg,
    'transition-colors',
    t.hover,
  ].join(' ');
}

/** Paper-plane mark (Telegram / Send) at chip icon scale. */
const TelegramIcon: FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
);

/** Coffee cup mark for the Gas Fund link. */
const GasFundIcon: FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 2v2" />
    <path d="M14 2v2" />
    <path d="M16 8a4 4 0 0 1-8 0V6h8Z" />
    <path d="M6 8h16v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8Z" />
    <path d="M6 14H4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2" />
  </svg>
);
