/**
 * Light haptic feedback for Fartmaximizer interactions (mobile / supported devices).
 * No-ops when `navigator.vibrate` is unavailable or the user prefers reduced motion.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function vibrate(pattern: number | number[]): void {
  if (prefersReducedMotion()) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

/** Filter tab, generic UI tap */
export function hapticTap(): void {
  vibrate(8);
}

/** Upvote — short affirming double-tap */
export function hapticVoteUp(): void {
  vibrate([12, 40, 18]);
}

/** Downvote — single sharper pulse */
export function hapticVoteDown(): void {
  vibrate(22);
}

/** Rank changed after vote — stronger confirmation */
export function hapticRankShift(): void {
  vibrate([16, 30, 24, 30, 32]);
}

/** Submit filing */
export function hapticSubmit(): void {
  vibrate([10, 50, 28]);
}

/** #1 lethal card interaction */
export function hapticLethal(): void {
  vibrate([20, 35, 40, 35, 50]);
}
