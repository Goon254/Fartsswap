'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import {
  formatPressDate,
  PRESS_CONTACT,
  PRESS_DOCKET,
  PRESS_EMBARGO_ISO,
  PRESS_ISSUE_DATE_DISPLAY,
  type PressContactKind,
} from '@/lib/press';

interface PressHeaderProps {
  /** Fires when one of the contact links / buttons is clicked. */
  onContactClick: (kind: PressContactKind) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Press release header / release rail.
 *
 * Treats the top of the page like the head of a paper press release: a
 * "FOR IMMEDIATE RELEASE / EMBARGOED UNTIL" strip across the top, then a
 * two-column release rail with the docket + issuing department on the
 * left and a media-contact panel on the right. The Bureau seal anchors
 * the left column so the page reads as an issued document, not a blog
 * post.
 *
 * All contact links fire `press_contact_clicked` through the parent so
 * attribution stays consistent with the rest of the analytics surface.
 */
export const PressHeader: FC<PressHeaderProps> = ({ onContactClick }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10 lg:pt-12"
  >
    {/* — Top release strip — */}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-stark)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_90%,transparent)] px-5 py-3">
      <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span className="text-[var(--accent-brass)]">FOR IMMEDIATE RELEASE</span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
        <span className="hidden md:inline">Issued by the Bureau of Acoustic Gasology</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="amber" withDot>
          EMBARGOED · {formatPressDate(PRESS_EMBARGO_ISO)}
        </Chip>
        <Chip tone="brass">DOCKET № {PRESS_DOCKET}</Chip>
      </div>
    </div>

    {/* — Release rail — */}
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
      <div>
        <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
            §I
          </span>
          <span>PRESS BULLETIN · OFFICIAL RELEASE</span>
        </div>

        <h1
          className={[
            'mt-5 max-w-[20ch] font-display font-medium leading-[1.02] tracking-tight',
            'text-[var(--text-strong)] text-shadow-glow',
            'text-[2.4rem] sm:text-[3.1rem] md:text-[3.6rem] lg:text-[4rem]',
          ].join(' ')}
        >
          A formal release of{' '}
          <span className="italic text-[var(--accent-brass)]">acoustic diagnostics</span> to the
          public.
        </h1>

        <p className="mt-5 max-w-[58ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
          The Bureau of Acoustic Gasology, operating from Station OPS-04, has authorised the public
          release of Fartsswap.com, the world{'\u2019'}s first AI-powered fart diagnostic lab. This
          notice constitutes the official press packet under Docket № {PRESS_DOCKET}.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span className="text-[var(--accent-brass)]">{PRESS_ISSUE_DATE_DISPLAY}</span>
          <span aria-hidden="true" className="h-3 w-px bg-[var(--border-stark)]" />
          <span>FILED · §0.1 (Release Provision)</span>
          <span aria-hidden="true" className="h-3 w-px bg-[var(--border-stark)]" />
          <span>OFFICE · §9.1 (Press &amp; Diplomatic Correspondence)</span>
        </div>
      </div>

      {/* — Media contact panel — */}
      <aside className="self-start rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)] p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
            MEDIA CONTACT
          </div>
          <div className="text-[var(--accent-brass)]">
            <Seal size={48} className="opacity-90" />
          </div>
        </div>
        <div className="mt-3 font-display text-xl leading-snug tracking-tight text-[var(--text-strong)]">
          {PRESS_CONTACT.desk}
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-[0.85rem] leading-snug text-[var(--text-default)]">
          <ContactRow
            label="EMAIL"
            value={PRESS_CONTACT.email}
            href={`mailto:${PRESS_CONTACT.email}`}
            onClick={() => onContactClick('media_email')}
          />
          <ContactRow
            label="PHONE"
            value={PRESS_CONTACT.phone}
            href={`tel:${PRESS_CONTACT.phone.replace(/[^+\d]/g, '')}`}
            onClick={() => onContactClick('media_phone')}
          />
          <ContactRow
            label="STATION"
            value={PRESS_CONTACT.address}
            onClick={() => onContactClick('press_desk')}
          />
        </ul>
      </aside>
    </div>
  </motion.section>
);

interface ContactRowProps {
  label: string;
  value: string;
  href?: string;
  onClick: () => void;
}

const ContactRow: FC<ContactRowProps> = ({ label, value, href, onClick }) => {
  const inner = (
    <>
      <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        {label}
      </span>
      <span className="mt-0.5 block text-[var(--text-default)] transition-colors group-hover/row:text-[var(--text-strong)]">
        {value}
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} onClick={onClick} className="group/row block">
          {inner}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="group/row block w-full text-left"
        >
          {inner}
        </button>
      )}
    </li>
  );
};
