/**
 * Lightweight, typed analytics layer.
 *
 * Design goals:
 *  - Vendor-neutral. Components import a single `track()` and never know
 *    about the transport. Swapping to PostHog / Segment / a backend means
 *    editing this file only.
 *  - SSR-safe. Every browser API access is gated by `isBrowser()`. Calls
 *    from a server component path are no-ops.
 *  - Tiny on the wire. The "transport" in this milestone is a console
 *    logger (dev), an in-memory ring buffer (always, exposed for dev
 *    panels), and an opt-in HTTP beacon (NEXT_PUBLIC_ANALYTICS_ENDPOINT).
 *  - Anonymous session id is owned here, not in components. localStorage
 *    if available, sessionStorage fallback, in-memory final fallback.
 *
 * Component code shape:
 *   import { track } from '@/lib/analytics';
 *   track('caption_copied', { surface: 'report', variantId, captionIndex: 0 });
 */

import type { EventName, EventMap, PayloadFor } from './analytics-events';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AnalyticsContext {
  sessionId: string | null;
  /** Pathname + search at the time the event was recorded. */
  route: string;
  referrer: string | null;
  viewport: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  theme: 'dark' | 'light' | 'unknown';
  reducedMotion: boolean;
}

export interface AnalyticsRecord<E extends EventName = EventName> {
  name: E;
  payload: EventMap[E];
  context: AnalyticsContext;
  /** Epoch ms. */
  timestamp: number;
  iso: string;
  /** Client-generated UUID for idempotent server ingest (optional for older clients). */
  eventId?: string;
}

/**
 * Record an event. Compile-time enforced: `name` and `payload` must match
 * the schema in analytics-events.ts. SSR no-op.
 */
export function track<E extends EventName>(name: E, payload: PayloadFor<E>): void {
  if (!isBrowser()) return;
  emit(name, payload);
}

/**
 * Alias for `track()` reserved for page-level events. Kept as a separate
 * function so future transports can route view events differently (e.g.
 * compress duplicates) without changing call sites.
 */
export function pageView<E extends EventName>(name: E, payload: PayloadFor<E>): void {
  track(name, payload);
}

/**
 * Returns the current anonymous session id, creating one if necessary.
 * Returns `null` on the server. Components rarely need to call this — the
 * value is injected into every event context automatically.
 */
export function getAnonymousSessionId(): string | null {
  if (!isBrowser()) return null;
  if (cachedSessionId) return cachedSessionId;
  cachedSessionId = readOrCreateSessionId();
  return cachedSessionId;
}

/** Read-only snapshot of the last N events (for the dev debug panel). */
export function getBuffer(): readonly AnalyticsRecord[] {
  return buffer.slice();
}

/** Drop the entire buffer (test helper). */
export function clearBuffer(): void {
  buffer.length = 0;
}

/**
 * Subscribe to new records as they're emitted. Returns an unsubscribe fn.
 * Used by the AnalyticsDebugPanel; otherwise rarely needed.
 */
export function subscribe(fn: (record: AnalyticsRecord) => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'farts.com:analytics_id';
const BUFFER_MAX = 200;
const IS_DEV = process.env.NODE_ENV !== 'production';
const HTTP_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

let cachedSessionId: string | null = null;
const buffer: AnalyticsRecord[] = [];
const subscribers = new Set<(record: AnalyticsRecord) => void>();
let reducedMotionFired = false;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function emit<E extends EventName>(name: E, payload: PayloadFor<E>): void {
  const ctx = buildContext();
  const now = Date.now();
  const eventId =
    typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : undefined;
  const record: AnalyticsRecord<E> = {
    name,
    payload,
    context: ctx,
    timestamp: now,
    iso: new Date(now).toISOString(),
    ...(eventId !== undefined ? { eventId } : {}),
  };

  pushBuffer(record);
  for (const sub of subscribers) {
    try {
      sub(record);
    } catch {
      // analytics must never throw into product code
    }
  }
  logToConsole(record);
  sendBeacon(record);

  // One-shot environment events. Done here so we don't have to scatter
  // detection code through layout / providers.
  if (!reducedMotionFired && ctx.reducedMotion && name !== 'reduced_motion_detected') {
    reducedMotionFired = true;
    // Defer one microtask so the originating event is logged first; keeps
    // the dev console story linear.
    queueMicrotask(() => track('reduced_motion_detected', { value: true }));
  }
}

function buildContext(): AnalyticsContext {
  if (!isBrowser()) {
    return {
      sessionId: null,
      route: '/',
      referrer: null,
      viewport: 'unknown',
      theme: 'unknown',
      reducedMotion: false,
    };
  }
  const w = window.innerWidth;
  const viewport: AnalyticsContext['viewport'] =
    w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  const themeAttr = document.documentElement.getAttribute('data-theme');
  const theme: AnalyticsContext['theme'] =
    themeAttr === 'dark' || themeAttr === 'light' ? themeAttr : 'unknown';
  const reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return {
    sessionId: getAnonymousSessionId(),
    route: window.location.pathname + window.location.search,
    referrer: document.referrer || null,
    viewport,
    theme,
    reducedMotion,
  };
}

function pushBuffer(record: AnalyticsRecord): void {
  buffer.push(record);
  if (buffer.length > BUFFER_MAX) buffer.shift();
  if (isBrowser()) {
    type AnalyticsWindow = Window & {
      __FARTS_ANALYTICS__?: {
        buffer: readonly AnalyticsRecord[];
        sessionId: string | null;
      };
    };
    (window as AnalyticsWindow).__FARTS_ANALYTICS__ = {
      buffer,
      sessionId: cachedSessionId,
    };
  }
}

function logToConsole(record: AnalyticsRecord): void {
  if (!IS_DEV) return;
  const color = colorForName(record.name);
  /* eslint-disable no-console */
  console.groupCollapsed(
    `%c[farts.com] %c${record.name}`,
    'color:#d9b26a;font-weight:600;',
    `color:${color};font-weight:500;`,
  );
  console.log('payload', record.payload);
  console.log('context', record.context);
  console.log('at', record.iso);
  console.groupEnd();
  /* eslint-enable no-console */
}

function sendBeacon(record: AnalyticsRecord): void {
  if (!HTTP_ENDPOINT || !isBrowser()) return;
  try {
    const body = JSON.stringify(record);
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(HTTP_ENDPOINT, body);
    } else {
      void fetch(HTTP_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // analytics is best-effort; never crash a click handler
  }
}

function readOrCreateSessionId(): string {
  // Try localStorage (cross-tab + persistent across reloads). If it throws
  // (Safari ITP, private mode, locked storage), fall back to sessionStorage,
  // then in-memory.
  try {
    if (typeof window === 'undefined') return generateId();
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fresh = generateId();
    try {
      window.localStorage.setItem(STORAGE_KEY, fresh);
    } catch {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, fresh);
      } catch {
        // pure in-memory
      }
    }
    return fresh;
  } catch {
    try {
      if (typeof window === 'undefined') return generateId();
      const existing = window.sessionStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
      const fresh = generateId();
      window.sessionStorage.setItem(STORAGE_KEY, fresh);
      return fresh;
    } catch {
      return generateId();
    }
  }
}

function generateId(): string {
  if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function colorForName(name: string): string {
  // Stable hash → one of the brand alert tones, so each event type has a
  // consistent colour across dev sessions.
  const palette = ['#2dbfaf', '#d9b26a', '#65a375', '#4aa7c8', '#c8453a'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length] ?? '#d9b26a';
}
