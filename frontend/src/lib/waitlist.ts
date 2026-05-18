/**
 * Frontend-only waitlist persistence.
 *
 * No network. No backend. The submission lives in `localStorage` so the
 * launch shell can render a persistent "Filed. Founding designation
 * reserved." state on subsequent visits. When real intake lands, the same
 * function signature can wrap a POST and the call sites won't change.
 */

const STORAGE_KEY = 'farts:waitlist:v1';

export interface WaitlistSubmission {
  /** Optional. The user's preferred designation. */
  name: string;
  /** Optional. Stored locally; never leaves the device. */
  email: string;
  /** Optional. The brand-voice waitlist prompt. */
  fartName: string;
  /** Deterministic founding number, computed from the inputs. */
  founderNumber: string;
  /** ISO timestamp of when the submission landed. */
  submittedAtIso: string;
}

export interface WaitlistInput {
  name: string;
  email: string;
  fartName: string;
}

const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Hash → 5-digit founding number, anchored deterministically off the
 * combined inputs. Same person submitting twice gets the same number.
 */
export function generateFounderNumber(input: WaitlistInput): string {
  const joined = `${input.name.trim()}|${input.email.trim().toLowerCase()}|${input.fartName.trim()}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < joined.length; i++) {
    h ^= joined.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  // 1000..99999, padded to 5 digits — feels like a founders' ledger.
  const n = (h % 99_000) + 1000;
  return n.toString().padStart(5, '0');
}

/**
 * Persist a waitlist submission to localStorage. Returns the stored
 * record so the UI can render the success state immediately without
 * re-reading.
 */
export function persistWaitlistSubmission(input: WaitlistInput): WaitlistSubmission {
  const record: WaitlistSubmission = {
    name: input.name.trim(),
    email: input.email.trim(),
    fartName: input.fartName.trim(),
    founderNumber: generateFounderNumber(input),
    submittedAtIso: new Date().toISOString(),
  };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Private mode / quota — swallow; the success state still renders
      // for this session, just not on the next visit.
    }
  }
  return record;
}

/**
 * Read a previously-stored submission. Returns null if nothing is stored
 * or if the stored value is malformed (defensive against future schema
 * changes).
 */
export function readWaitlistSubmission(): WaitlistSubmission | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WaitlistSubmission>;
    if (
      typeof parsed.founderNumber === 'string' &&
      typeof parsed.submittedAtIso === 'string'
    ) {
      return {
        name: typeof parsed.name === 'string' ? parsed.name : '',
        email: typeof parsed.email === 'string' ? parsed.email : '',
        fartName: typeof parsed.fartName === 'string' ? parsed.fartName : '',
        founderNumber: parsed.founderNumber,
        submittedAtIso: parsed.submittedAtIso,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** Clear any stored submission. Useful for design QA. Exposed for completeness. */
export function clearWaitlistSubmission(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
