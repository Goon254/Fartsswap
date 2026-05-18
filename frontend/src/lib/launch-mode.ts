/**
 * Single switch for the pre-launch shell.
 *
 * - `LAUNCH_MODE`        : when true, the root `/` route renders the
 *                          launch shell instead of the regular landing.
 *                          Read from `NEXT_PUBLIC_LAUNCH_MODE` at build
 *                          time so it can be flipped from CI / env without
 *                          touching code. Defaults to `true` while we are
 *                          pre-launch.
 *
 * - `RELEASE_TARGET_ISO` : the date the public filing line opens. Used by
 *                          `<ReleaseBulletin>` to drive the countdown. Set
 *                          to an explicit ISO string so SSR + CSR agree on
 *                          the same epoch. Override via env if needed.
 *
 * The dedicated `/launch` route always renders the launch shell regardless
 * of `LAUNCH_MODE`, so a stakeholder can preview it after we go live.
 */

const RAW_MODE = process.env.NEXT_PUBLIC_LAUNCH_MODE;
const RAW_TARGET = process.env.NEXT_PUBLIC_RELEASE_TARGET_ISO;

/** Default: launch mode on, except when explicitly turned off. */
export const LAUNCH_MODE: boolean =
  RAW_MODE === undefined ? true : RAW_MODE.toLowerCase() !== 'false';

/** Default target: ~14 weeks out from the build date, anchored at 17:00 UTC. */
export const RELEASE_TARGET_ISO: string =
  RAW_TARGET && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(RAW_TARGET)
    ? RAW_TARGET
    : '2026-08-21T17:00:00Z';

export interface CountdownParts {
  /** Days remaining. Negative once the date passes. */
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the target has passed. */
  released: boolean;
}

/**
 * Pure computation of `now → target` countdown parts. Caller owns the
 * "what is now" decision (a stable SSR `Date.now()` vs. a live ticking
 * client clock) so this module stays deterministic.
 */
export function computeCountdown(nowMs: number, targetIso: string): CountdownParts {
  const target = new Date(targetIso).getTime();
  const diff = target - nowMs;
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, released: false };
  }
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, released: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, released: false };
}

/** Zero-padded display for countdown digits. */
export function pad2(n: number): string {
  const v = Math.max(0, Math.floor(n));
  return v < 10 ? `0${v}` : v.toString();
}
