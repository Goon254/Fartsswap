import type { FC } from 'react';

/**
 * Fixed-position background stack used on the landing page:
 *   1. Radial brand glow (slowly pulses).
 *   2. Faint 56px grid.
 *   3. Subtle film-noise overlay.
 *
 * Each layer is pointer-events:none and z-0; page content sits above with
 * `relative` + a higher z-index.
 */
export const BackgroundLayers: FC = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-radial-glow animate-brand-pulse" />
    <div className="absolute inset-0 bg-grid opacity-90" />
    <div className="absolute inset-0 bg-noise opacity-[0.05] mix-blend-overlay" />
    {/* horizon line: subtle warm gradient on the very top + bottom edges */}
    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--bg-base)] to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg-base)] to-transparent" />
  </div>
);
