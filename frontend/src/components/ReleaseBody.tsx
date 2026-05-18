'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { PRESS_DOCKET, PRESS_ISSUE_DATE_DISPLAY } from '@/lib/press';

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * The press release body proper.
 *
 * Single-column editorial layout. The headline is set in our brand display
 * face (Fraunces, serif), and the body is rendered in the same family so
 * the section reads like a wire-service release — distinct from the
 * sans-serif UI elsewhere. Each paragraph is hand-authored straight; the
 * comedy comes from the institutional gravity, not from a wink.
 *
 * The body is deliberately self-contained — there is no MDX, no CMS, no
 * dynamic injection. If the launch copy changes, it changes here.
 */
export const ReleaseBody: FC = () => (
  <motion.section
    id="release"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <article
      className={[
        'relative overflow-hidden rounded-md border border-[var(--border-stark)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)] px-7 py-10 sm:px-10 sm:py-14',
        'shadow-[0_30px_70px_-40px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
          <span>RELEASE BODY · §I</span>
          <span aria-hidden="true" className="h-3 w-px bg-[var(--border-stark)]" />
          <span className="text-[var(--text-muted)]">{PRESS_ISSUE_DATE_DISPLAY}</span>
          <span aria-hidden="true" className="h-3 w-px bg-[var(--border-stark)]" />
          <span className="text-[var(--text-muted)]">DOCKET № {PRESS_DOCKET}</span>
        </div>
        <h2 className="mt-4 max-w-[28ch] font-display text-3xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-4xl">
          Farts.com today announced the public release of the world{'\u2019'}s first
          AI-powered fart diagnostic lab.
        </h2>
        <p className="mt-3 max-w-[58ch] font-display italic text-[1.05rem] leading-snug text-[var(--accent-brass)]">
          Critical infrastructure for humanity{'\u2019'}s most neglected audio format.
        </p>
      </header>

      <div
        className={[
          'press-body grid grid-cols-1 gap-5 font-display text-[1.05rem] leading-relaxed text-[var(--text-default)] sm:text-[1.08rem]',
          // The press release uses an editorial drop-cap to anchor the
          // first paragraph and signal "release body" to scanning readers.
          'first-letter:font-display first-letter:text-[3.2rem] first-letter:font-medium first-letter:leading-[0.85]',
          'first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[var(--accent-brass)]',
        ].join(' ')}
      >
        <p>
          STATION OPS-04 &mdash; Farts.com today announced the public release of the world{'\u2019'}s
          first AI-powered fart diagnostic lab, operating under the authority of the Bureau of
          Acoustic Gasology. The platform issues clinically unnecessary reports on civilian
          acoustic events, each accompanied by a serialised filing number and a tamper-evident
          hash.
        </p>
        <p>
          Civilians may submit acoustic samples through a ten-second recording interface, or
          generate fully fabricated specimens for documentation purposes. Submissions are processed
          by a parody-grade language model and returned as institutional dossiers comprising
          classification, power score, threat level, probable cause, and one cinematic parallel.
        </p>
        <p>
          The Bureau has determined that civilization currently lacks adequate filing infrastructure
          for its most neglected audio format. The launch addresses this gap through standardised
          reporting, brass-grade certification options, and a designated challenge mechanism for
          disputes between issuing parties.
        </p>
        <p>
          Each report is engineered for archival and screenshot use. Share-card output is rendered
          at a vertical 9:16 specification suitable for hand-held viewing surfaces. Premium
          artifacts &mdash; including the Official PDF Certificate and the Printable Wall
          Certificate &mdash; extend the dossier into archival and print contexts.
        </p>
        <p>
          Founding designations are being processed under §0.1 of the Release Provision. The public
          filing line opens on the date set forth in Bulletin № 7 / 7. Press inquiries may be
          directed to Desk §9.1 of the Press &amp; Diplomatic Correspondence office.
        </p>
        <p className="font-mono text-[0.7rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          &mdash; ENDS &mdash;
        </p>
      </div>
    </article>
  </motion.section>
);
