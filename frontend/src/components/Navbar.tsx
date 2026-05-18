'use client';

import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Wordmark } from '@/components/Wordmark';
import { NAVBAR_STATUS } from '@/lib/data';

/**
 * Sticky top navigation. Stays minimal so the hero owns the visual weight.
 *
 * Layout:
 *   [Wordmark]                              [Bureau status]  [Theme toggle]
 *
 * The status chip uses a breathing dot so the eye reads "live system" rather
 * than "decorative label".
 */
export const Navbar: FC = () => (
  <header
    className={[
      'sticky top-0 z-30 backdrop-blur-md',
      'border-b border-[var(--border-subtle)]',
      'bg-[color-mix(in_oklab,var(--bg-base)_82%,transparent)]',
    ].join(' ')}
  >
    <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
      <div className="flex items-center gap-4">
        <Wordmark />
        <span aria-hidden="true" className="hidden h-5 w-px bg-[var(--border-stark)] sm:inline-block" />
        <span className="hidden font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)] sm:inline">
          Acoustic Diagnostics
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden items-center gap-3 md:flex">
          <Chip tone="neutral">{NAVBAR_STATUS.bureau}</Chip>
          <Chip tone="brass">{NAVBAR_STATUS.station}</Chip>
          <Chip tone="green" withDot>
            {NAVBAR_STATUS.uptime}
          </Chip>
        </div>
        <ThemeToggle />
      </div>
    </div>
  </header>
);
