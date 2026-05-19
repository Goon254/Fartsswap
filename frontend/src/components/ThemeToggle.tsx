'use client';

import { useCallback, useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'fartsswap.com:theme';

/**
 * Theme toggle that flips `<html data-theme>` between `dark` and `light`.
 *
 * On mount we sync from localStorage if present, otherwise we honour
 * `prefers-color-scheme`. The toggle never blocks rendering — the initial
 * theme is set inline in <head> by `<ThemeBootstrap />` to avoid a
 * paint-time flash.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const stored = root.getAttribute('data-theme') as Theme | null;
    setTheme(stored ?? 'dark');
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage unavailable (private mode, ITP, etc.) — fine, the
        // toggle still works for this session.
      }
      // Side-effect outside the state updater so React strict-mode double
      // invocation doesn't fire the event twice.
      queueMicrotask(() => track('theme_toggled', { from: prev, to: next }));
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={[
        'group/toggle relative inline-flex h-7 w-[3.4rem] items-center rounded-full',
        'border border-[var(--border-stark)] bg-[var(--bg-panel-strong)]',
        'transition-colors duration-300',
      ].join(' ')}
    >
      <span
        className={[
          'absolute left-1 inline-block h-5 w-5 rounded-full',
          'bg-[var(--accent-brass)]',
          'shadow-[0_0_8px_color-mix(in_oklab,var(--accent-brass)_45%,transparent)]',
          'transition-transform duration-300 ease-out',
          mounted && theme === 'light' ? 'translate-x-[1.55rem]' : 'translate-x-0',
        ].join(' ')}
      />
      <span className="ml-9 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        {theme === 'dark' ? 'DRK' : 'LGT'}
      </span>
    </button>
  );
}

/**
 * Injected inline in <head> to prevent a theme-flash on first paint.
 * Reads localStorage / prefers-color-scheme synchronously before React boots.
 */
export const ThemeBootstrap = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `(() => {
        try {
          const stored = localStorage.getItem('${STORAGE_KEY}');
          const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
          const theme = stored === 'light' || stored === 'dark' ? stored : (sys === 'light' ? 'dark' : 'dark');
          document.documentElement.setAttribute('data-theme', theme);
        } catch (_) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      })();`,
    }}
  />
);
