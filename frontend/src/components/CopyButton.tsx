'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type FC, type ReactNode } from 'react';

interface CopyButtonProps {
  text: string;
  /** Optional label override. Default: "COPY". */
  label?: string;
  copiedLabel?: string;
  children?: ReactNode;
  className?: string;
  /** Fired after a successful clipboard write. Used by analytics callers. */
  onCopy?: (text: string) => void;
}

/**
 * Small inline copy button used by the caption cards.
 *
 * On click: writes `text` to the clipboard, flips into a momentary "COPIED"
 * state for 1.6s, then reverts. AnimatePresence handles the label crossfade
 * so the button width doesn't jitter. Falls back gracefully when the
 * Clipboard API is unavailable (insecure context, browser refusal).
 */
export const CopyButton: FC<CopyButtonProps> = ({
  text,
  label = 'COPY',
  copiedLabel = 'COPIED',
  children,
  className,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const onClick = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      onCopy?.(text);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Browser refused. Silently keep the original label — the user will
      // see no flash and can try again. Better than a half-broken toast.
    }
  }, [text, onCopy]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? copiedLabel : label}
      className={[
        'group/copy inline-flex h-7 min-w-[5rem] items-center justify-center gap-1.5',
        'rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel-strong)] px-2.5',
        'font-mono text-[0.6rem] uppercase tracking-wide-3',
        copied
          ? 'border-[var(--accent-teal)] text-[var(--accent-teal)]'
          : 'text-[var(--text-muted)] hover:border-[var(--accent-brass)] hover:text-[var(--accent-brass)]',
        'transition-colors duration-200',
        className ?? '',
      ].join(' ')}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'copied' : 'idle'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <CheckIcon /> <span>{copiedLabel}</span>
            </>
          ) : (
            <>
              <ClipIcon /> <span>{children ?? label}</span>
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

const ClipIcon: FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="0.9" fill="none" />
    <rect x="3.5" y="0.6" width="3" height="1.2" rx="0.3" fill="currentColor" />
  </svg>
);

const CheckIcon: FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M1.5 5.2 L4 7.6 L8.5 2.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="square" />
  </svg>
);
