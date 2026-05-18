'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, type FC } from 'react';
import { Chip } from '@/components/Chip';
import {
  formatPressDate,
  PRESS_CONTACT,
  PRESS_DOCKET,
  PRESS_EMBARGO_ISO,
  type PressContactKind,
} from '@/lib/press';

interface EmbargoNoticeProps {
  /** Fires once when the notice is rendered, for analytics. */
  onMounted: (embargoIso: string, docket: string) => void;
  /** Fires when one of the contact / archive-request CTAs is clicked. */
  onContactClick: (kind: PressContactKind) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Embargo notice + "downloadable" fact-sheet packets.
 *
 * Four sub-blocks:
 *   1. Embargo terms strip       lifted-on date, docket, "EMBARGOED" chip
 *   2. Provisions body           three deadpan press-handling provisions
 *   3. Fact-sheet packet grid    three sealed-envelope tiles, each
 *                                "REQUEST PACKET" routing through the
 *                                press_contact_clicked analytics event
 *   4. Press desk footer         desk reference + email/phone shortcuts
 *
 * No file is actually delivered. The visual treatment mirrors a real
 * embargo room where journalists request packets through a desk, not by
 * direct download.
 */
export const EmbargoNotice: FC<EmbargoNoticeProps> = ({ onMounted, onContactClick }) => {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    onMounted(PRESS_EMBARGO_ISO, PRESS_DOCKET);
  }, [onMounted]);

  return (
    <motion.section
      id="embargo"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 lg:px-10"
    >
      <article
        className={[
          'relative isolate overflow-hidden rounded-md border border-[var(--border-brass)]',
          'bg-[color-mix(in_oklab,var(--accent-brass)_4%,transparent)]',
          'shadow-[0_30px_70px_-40px_color-mix(in_oklab,black_70%,transparent)]',
        ].join(' ')}
      >
        {/* — 1. Terms strip — */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)] px-5 py-3">
          <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
            <span className="text-[var(--accent-brass)]">EMBARGO NOTICE · §V</span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-brass)] md:inline-block" />
            <span className="hidden md:inline">Press handling instructions</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="amber" withDot>
              EMBARGOED · {formatPressDate(PRESS_EMBARGO_ISO)}
            </Chip>
            <Chip tone="brass">DOCKET № {PRESS_DOCKET}</Chip>
          </div>
        </header>

        {/* — 2. Provisions body — */}
        <div className="grid grid-cols-1 gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <div>
            <h2 className="font-display text-2xl leading-snug tracking-tight text-[var(--text-strong)] sm:text-3xl">
              Press copies are issued under standard pre-release terms.
            </h2>
            <p className="mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
              The Bureau requests that all coverage prior to the embargo lift be coordinated
              through Desk §9.1. Material is provided for editorial preparation only; reproduction
              outside accredited publications is reserved until release day.
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-[0.9rem] leading-snug text-[var(--text-default)]">
              {PROVISIONS.map((p) => (
                <li
                  key={p}
                  className="flex gap-2 before:mt-[0.55rem] before:h-px before:w-3 before:flex-none before:bg-[var(--accent-brass)] before:content-['']"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* — 3. Fact-sheet packets — */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
              FACT SHEET PACKETS
            </div>
            {PACKETS.map((packet) => (
              <button
                key={packet.code}
                type="button"
                onClick={() => onContactClick('archive_request')}
                className={[
                  'group/packet flex w-full items-start justify-between gap-3 rounded-sm border border-dashed border-[var(--border-brass)]',
                  'bg-[color-mix(in_oklab,var(--bg-panel)_70%,transparent)] px-4 py-3 text-left transition-colors',
                  'hover:bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)]',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                    {packet.code}
                  </div>
                  <div className="mt-1 truncate font-display text-[1rem] leading-tight text-[var(--text-strong)]">
                    {packet.name}
                  </div>
                  <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                    {packet.size}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)] group-hover/packet:text-[var(--text-strong)]">
                  REQUEST PACKET
                  <EnvelopeIcon />
                </span>
              </button>
            ))}
            <p className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Media assets available upon request from Desk §9.1.
            </p>
          </div>
        </div>

        {/* — 4. Press desk footer — */}
        <footer
          id="contact"
          className="flex flex-col gap-3 border-t border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            <span className="text-[var(--accent-brass)]">{PRESS_CONTACT.desk}</span>{' '}
            · {PRESS_CONTACT.address}
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3">
            <a
              href={`mailto:${PRESS_CONTACT.email}`}
              onClick={() => onContactClick('media_email')}
              className="text-[var(--accent-brass)] transition-colors hover:text-[var(--text-strong)]"
            >
              {PRESS_CONTACT.email}
            </a>
            <span aria-hidden="true" className="h-3 w-px bg-[var(--border-brass)]" />
            <a
              href={`tel:${PRESS_CONTACT.phone.replace(/[^+\d]/g, '')}`}
              onClick={() => onContactClick('media_phone')}
              className="text-[var(--accent-brass)] transition-colors hover:text-[var(--text-strong)]"
            >
              {PRESS_CONTACT.phone}
            </a>
          </div>
        </footer>
      </article>
    </motion.section>
  );
};

const PROVISIONS = [
  'Coverage prior to the embargo lift must be coordinated through Desk §9.1.',
  'Direct quotations from boilerplate statements are permitted with full attribution.',
  'Use of sample assets is permitted strictly for editorial preparation.',
  'Speculation on future bureau operations is discouraged in the strongest possible terms.',
] as const;

const PACKETS = [
  {
    code: 'PACKET · 01',
    name: 'Official assets · seal, wordmark, palette',
    size: 'ZIP · 4.2 MB · upon request',
  },
  {
    code: 'PACKET · 02',
    name: 'Sample dossiers · six fully written',
    size: 'PDF · 1.1 MB · upon request',
  },
  {
    code: 'PACKET · 03',
    name: 'Director biographies · three roles',
    size: 'PDF · 380 KB · upon request',
  },
] as const;

const EnvelopeIcon: FC = () => (
  <svg width="11" height="9" viewBox="0 0 11 9" aria-hidden="true">
    <rect x="0.5" y="0.5" width="10" height="8" stroke="currentColor" strokeWidth="0.9" fill="none" />
    <path d="M0.5 0.5 L5.5 5 L10.5 0.5" stroke="currentColor" strokeWidth="0.9" fill="none" />
  </svg>
);
