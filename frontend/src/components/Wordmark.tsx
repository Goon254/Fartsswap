import type { FC } from 'react';

/**
 * Lockup for "FARTSSWAP.COM".
 *
 * Set in the editorial serif at a tight tracking with the ".com" deliberately
 * undersized + brass — like a stamped suffix on classified documentation
 * rather than a domain logo.
 */
export const Wordmark: FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizing = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base';
  return (
    <span
      className={`font-display ${sizing} font-medium leading-none tracking-tight text-[var(--text-strong)]`}
    >
      <span>FARTSSWAP</span>
      <span className="px-[0.05em] text-[var(--accent-brass)]">.</span>
      <span className="font-mono align-[0.15em] text-[0.45em] tracking-wide-3 text-[var(--accent-brass)]">
        COM
      </span>
    </span>
  );
};
