'use client';

import { useCallback, useState, type FC } from 'react';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { track } from '@/lib/analytics';

async function postCommand(
  command: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(`/api/creator-tools/discord/${command}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let json: unknown = null;
  try {
    json = (await res.json()) as unknown;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}

async function getMethane(): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch('/api/creator-tools/discord/methane-index', { cache: 'no-store' });
  let json: unknown = null;
  try {
    json = (await res.json()) as unknown;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}

/**
 * Operator console for previewing Discord-style `/classify`, `/challenge`, etc.
 * Proxies to Nest via `/api/creator-tools/discord/*` using server-side secrets.
 */
export const CreatorToolsLab: FC = () => {
  const [out, setOut] = useState<string>('Awaiting bureau instruction.');
  const [busy, setBusy] = useState(false);

  const [customFartName, setCustomFartName] = useState('');
  const [tonePreset, setTonePreset] = useState('');
  const [variantId, setVariantId] = useState('silent_assassin');
  const [challengeReportId, setChallengeReportId] = useState('');
  const [badgeTemplate, setBadgeTemplate] = useState('honorary_filer');
  const [honoree, setHonoree] = useState('');
  const [wrappedSlug, setWrappedSlug] = useState('');
  const [wrappedSession, setWrappedSession] = useState('');
  const [shareReportId, setShareReportId] = useState('');

  const run = useCallback(async (command: string, fn: () => Promise<{ ok: boolean; status: number; json: unknown }>) => {
    setBusy(true);
    try {
      const r = await fn();
      setOut(JSON.stringify(r.json, null, 2));
      void track('creator_tools_lab_invoked', { command, ok: r.ok, status: r.status });
    } catch (e) {
      setOut(e instanceof Error ? e.message : 'Request failed');
      void track('creator_tools_lab_invoked', { command, ok: false, status: 0 });
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
        <header className="mb-8 border-b border-[var(--border-subtle)] pb-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            INTERNAL · COMMUNITY LAB
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[var(--text-strong)]">
            Creator tooling (Discord-ready)
          </h1>
          <p className="mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
            This desk issues bot-shaped payloads against the live API: fake dossiers, challenges, ceremonial badges,
            share links, and ritual bulletins. Transport remains mocked server-side; wire a webhook adapter when the
            Bureau authorises outbound Discord traffic.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_4%,transparent)] p-5">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-strong)]">
              §I · Classify
            </h2>
            <label className="mt-3 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Custom subject (optional)
            </label>
            <input
              value={customFartName}
              onChange={(e) => setCustomFartName(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] px-3 py-2 text-sm"
              placeholder="The Midnight Bean"
            />
            <label className="mt-3 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Tone preset (optional)
            </label>
            <input
              value={tonePreset}
              onChange={(e) => setTonePreset(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] px-3 py-2 text-sm"
              placeholder="clinical"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run('classify', () =>
                  postCommand('classify', {
                    invokerLabel: 'community_lab',
                    ...(customFartName.trim() ? { customFartName: customFartName.trim() } : {}),
                    ...(tonePreset.trim() ? { tonePreset: tonePreset.trim() } : {}),
                  }),
                )
              }
              className="mt-4 w-full rounded-sm bg-[var(--accent-brass)] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--bg-base)] disabled:opacity-50"
            >
              Invoke classify
            </button>
          </section>

          <section className="rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-strong)]">
              §II · Challenge
            </h2>
            <label className="mt-3 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Variant id
            </label>
            <input
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            />
            <label className="mt-3 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Report id (optional)
            </label>
            <input
              value={challengeReportId}
              onChange={(e) => setChallengeReportId(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-base)] px-3 py-2 text-sm font-mono"
              placeholder="uuid"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run('challenge', () =>
                  postCommand('challenge', {
                    invokerLabel: 'community_lab',
                    variantId: variantId.trim(),
                    ...(challengeReportId.trim() ? { reportId: challengeReportId.trim() } : {}),
                  }),
                )
              }
              className="mt-4 w-full rounded-sm border border-[var(--border-brass)] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-strong)] disabled:opacity-50"
            >
              Register challenge
            </button>
          </section>

          <section className="rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-strong)]">
              §III · Badge
            </h2>
            <select
              value={badgeTemplate}
              onChange={(e) => setBadgeTemplate(e.target.value)}
              className="mt-3 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            >
              <option value="honorary_filer">Honorary filer</option>
              <option value="dispute_champion">Dispute champion</option>
              <option value="bulletin_clerk">Bulletin clerk</option>
            </select>
            <label className="mt-3 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Honoree line
            </label>
            <input
              value={honoree}
              onChange={(e) => setHonoree(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-base)] px-3 py-2 text-sm"
              placeholder="The moderation desk"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run('badge', () =>
                  postCommand('badge', {
                    invokerLabel: 'community_lab',
                    templateId: badgeTemplate,
                    ...(honoree.trim() ? { honoreeLine: honoree.trim() } : {}),
                  }),
                )
              }
              className="mt-4 w-full rounded-sm border border-[var(--border-brass)] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-strong)] disabled:opacity-50"
            >
              Issue badge
            </button>
          </section>

          <section className="rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-strong)]">
              §IV · Rituals
            </h2>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run('methane-index', () => getMethane())}
              className="mt-3 w-full rounded-sm bg-[var(--accent-brass)] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--bg-base)] disabled:opacity-50"
            >
              Pull methane index
            </button>
            <label className="mt-4 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Wrapped · report slug
            </label>
            <input
              value={wrappedSlug}
              onChange={(e) => setWrappedSlug(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-base)] px-3 py-2 text-sm font-mono"
              placeholder="r0123456789ab"
            />
            <label className="mt-3 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Wrapped · session id (alternative)
            </label>
            <input
              value={wrappedSession}
              onChange={(e) => setWrappedSession(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--border-stark)] bg-[var(--bg-base)] px-3 py-2 text-sm font-mono"
              placeholder="uuid"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run('wrapped', () =>
                  postCommand('wrapped', {
                    invokerLabel: 'community_lab',
                    ...(wrappedSlug.trim() ? { slug: wrappedSlug.trim() } : {}),
                    ...(wrappedSession.trim() ? { sessionId: wrappedSession.trim() } : {}),
                  }),
                )
              }
              className="mt-4 w-full rounded-sm border border-[var(--border-brass)] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-strong)] disabled:opacity-50"
            >
              Compile wrapped
            </button>
          </section>

          <section className="rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5 lg:col-span-2">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-strong)]">
              §V · Share link
            </h2>
            <label className="mt-3 block font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Report id
            </label>
            <input
              value={shareReportId}
              onChange={(e) => setShareReportId(e.target.value)}
              className="mt-1 w-full max-w-xl rounded-sm border border-[var(--border-stark)] bg-[var(--bg-base)] px-3 py-2 text-sm font-mono"
              placeholder="uuid"
            />
            <button
              type="button"
              disabled={busy || !shareReportId.trim()}
              onClick={() =>
                void run('share', () =>
                  postCommand('share', {
                    invokerLabel: 'community_lab',
                    reportId: shareReportId.trim(),
                  }),
                )
              }
              className="mt-4 rounded-sm border border-[var(--border-brass)] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-strong)] disabled:opacity-50"
            >
              Mint share link
            </button>
          </section>
        </div>

        <section className="mt-10 rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            §VI · Ledger output
          </h2>
          <pre className="mt-3 max-h-[480px] overflow-auto whitespace-pre-wrap break-words font-mono text-[0.72rem] leading-relaxed text-[var(--text-default)]">
            {out}
          </pre>
        </section>
      </main>
      <FooterLoreStrip />
    </>
  );
};
