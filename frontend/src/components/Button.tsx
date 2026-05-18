'use client';

import { motion } from 'framer-motion';
import type { FC, MouseEventHandler, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  variant?: Variant;
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** If provided, renders an anchor instead of a button. */
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const SHARED =
  'group/btn relative inline-flex items-center justify-center gap-3 px-5 py-3 text-sm font-medium tracking-wide-2 uppercase font-mono select-none rounded-sm transition-colors duration-200';

const VARIANTS: Record<Variant, string> = {
  primary: [
    'bg-[var(--accent-brass)] text-[var(--bg-base)]',
    'hover:bg-[var(--color-brass-400)]',
    'shadow-[0_1px_0_0_color-mix(in_oklab,white_18%,transparent)_inset,0_-1px_0_0_color-mix(in_oklab,black_22%,transparent)_inset]',
  ].join(' '),
  secondary: [
    'bg-transparent text-[var(--text-strong)]',
    'ring-1 ring-inset ring-[var(--border-stark)]',
    'hover:ring-[var(--accent-teal)] hover:text-[var(--accent-teal)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-muted)]',
    'hover:text-[var(--text-strong)]',
  ].join(' '),
};

/**
 * Tactile brand button. Renders as `<a>` if `href` is provided.
 *
 * Motion: an extremely small press (0.985) on tap + a brief lift on hover.
 * The brass primary gets an embossed inset shadow so it reads as a stamped
 * key rather than a flat rectangle.
 */
export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  children,
  leading,
  trailing,
  href,
  onClick,
  type = 'button',
  disabled,
  ariaLabel,
  className,
}) => {
  const classes = `${SHARED} ${VARIANTS[variant]} ${className ?? ''}`;
  const inner = (
    <>
      {leading ? <span className="opacity-80">{leading}</span> : null}
      <span>{children}</span>
      {trailing ? (
        <span className="transition-transform duration-200 group-hover/btn:translate-x-0.5">
          {trailing}
        </span>
      ) : null}
    </>
  );

  const motionProps = {
    whileHover: { y: -1 },
    whileTap: { scale: 0.985 },
    transition: { duration: 0.15, ease: [0.22, 0.61, 0.36, 1] as const },
  };

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
        aria-label={ariaLabel}
        {...motionProps}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={classes}
      onClick={onClick as MouseEventHandler<HTMLButtonElement> | undefined}
      aria-label={ariaLabel}
      {...motionProps}
    >
      {inner}
    </motion.button>
  );
};
