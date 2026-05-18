'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { pageView, track } from '@/lib/analytics';
import type {
  OpsDashboardPayload,
  OpsFunnelStep,
  OpsKpis,
  OpsVariantRow,
} from '@/lib/ops-dashboard-types';

const WINDOWS: { hours: number; label: string }[] = [
  { hours: 24, label: '24h' },
  { hours: 168, label: '7d' },
  { hours: 720, label: '30d' },
];

function pct(n: number | null, digits = 1): string {
  if (n === null || Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

function trend(curr: number, prev: number): { arrow: string; label: string } {
  if (prev <= 0) return { arrow: curr > 0 ? '↑' : '·', label: 'no prior window' };
  const d = ((curr - prev) / prev) * 100;
  if (d > 5) return { arrow: '↑', label: `+${d.toFixed(0)}% vs prior` };
  if (d < -5) return { arrow: '↓', label: `${d.toFixed(0)}% vs prior` };
  return { arrow: '→', label: 'flat vs prior' };
}

function KpiCard(props: {
  title: string;
  subtitle?: string;
  value: string;
  accent?: 'brass' | 'teal' | 'amber' | 'green';
}) {
  const border =
    props.accent === 'teal'
      ? 'border-teal-700/60'
      : props.accent === 'amber'
        ? 'border-alert-amber/50'
        : props.accent === 'green'
          ? 'border-alert-green/50'
          : 'border-brass-600/40';
  return (
    <div
      className={`rounded-lg border ${border} bg-[var(--bg-panel)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {props.title}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--text-strong)]">
        {props.value}
      </p>
      {props.subtitle ? (
        <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">{props.subtitle}</p>
      ) : null}
    </div>
  );
}

function FunnelRail({ steps }: { steps: OpsFunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.id} className="flex items-center gap-3">
          <div className="w-44 shrink-0 font-mono text-xs text-[var(--text-muted)]">{s.label}</div>
          <div className="relative h-7 min-w-0 flex-1 overflow-hidden rounded bg-[var(--bg-panel-strong)]">
            <div
              className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-teal-900/80 to-teal-600/90"
              style={{ width: `${Math.max(4, (s.count / max) * 100)}%` }}
            />
            <span className="relative z-10 flex h-full items-center px-2 font-mono text-xs text-[var(--text-strong)]">
              {s.count.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-charcoal-700/60 pb-2 last:border-0 last:pb-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-strong)]">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}

function VariantTableRow({
  v,
  open,
  onToggle,
}: {
  v: OpsVariantRow;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-charcoal-800/80 hover:bg-[var(--bg-panel-strong)]/40">
        <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs text-[var(--text-strong)]">
          {v.variantKey}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">{v.reportGenerations}</td>
        <td className="px-3 py-2 text-right tabular-nums">{v.shareViews}</td>
        <td className="px-3 py-2 text-right tabular-nums">{v.shareDownloadsSucceeded}</td>
        <td className="px-3 py-2 text-right tabular-nums">{v.challengeLinks}</td>
        <td className="px-3 py-2 text-right tabular-nums">{v.premiumIntents}</td>
        <td className="px-3 py-2 text-right tabular-nums text-teal-400">{pct(v.shareRate)}</td>
        <td className="px-1 py-2 text-center">
          <button
            type="button"
            onClick={onToggle}
            className="rounded border border-charcoal-600 px-1.5 py-0.5 text-[10px] uppercase text-[var(--text-muted)] hover:border-brass-600"
            aria-expanded={open}
          >
            {open ? '−' : '+'}
          </button>
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-charcoal-800 bg-[var(--bg-panel-strong)]/30">
          <td colSpan={8} className="px-4 py-3 font-mono text-[11px] text-[var(--text-muted)]">
            Challenge rate {pct(v.challengeRate)} · Premium rate {pct(v.premiumRate)} · Screenshot rate{' '}
            {pct(v.screenshotRate)}
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function OpsConsole() {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<OpsDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/ops/dashboard?hours=${hours}`, { cache: 'no-store' });
      const json = (await res.json()) as OpsDashboardPayload | { error?: string };
      if (!res.ok) {
        setErr(typeof json === 'object' && json && 'error' in json ? String(json.error) : 'Request failed');
        setData(null);
        return;
      }
      setData(json as OpsDashboardPayload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    void pageView('ops_view', { hours: 24 });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onWindow = (h: number) => {
    if (h === hours) return;
    track('ops_window_changed', { fromHours: hours, toHours: h });
    setHours(h);
  };

  const kpis: OpsKpis | null = data?.kpis ?? null;
  const tr = useMemo(() => {
    if (!kpis) return null;
    return {
      reports: trend(kpis.reportsInWindow, kpis.reportsPreviousWindow),
      shares: trend(kpis.shareLinksInWindow, kpis.shareLinksPreviousWindow),
    };
  }, [kpis]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <header className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-brass-500">
              Bureau of Acoustic Gasology
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl italic text-[var(--text-strong)]">
              Mission Control
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
              Launch telemetry for the core loop: issuance, propagation, ritual uptake, and premium pull-through.
              Not a public surface.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w.hours}
                type="button"
                onClick={() => onWindow(w.hours)}
                className={`rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                  hours === w.hours
                    ? 'border-brass-500 bg-brass-900/40 text-brass-400'
                    : 'border-charcoal-600 bg-[var(--bg-panel)] text-[var(--text-muted)] hover:border-teal-700'
                }`}
              >
                {w.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              className="rounded border border-teal-700 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-teal-400 hover:bg-teal-950/50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-muted)]">
          <span className="rounded border border-charcoal-600 px-2 py-0.5 text-[var(--text-strong)]">
            env: {data?.meta.nodeEnv ?? '…'}
          </span>
          <span
            className={`rounded border px-2 py-0.5 ${
              data?.meta.databaseOk
                ? 'border-alert-green/50 text-alert-green'
                : 'border-alert-red/50 text-alert-red'
            }`}
          >
            datastore: {data?.meta.databaseOk ? 'live' : 'degraded'}
          </span>
          <span>
            window {data?.window.sinceIso?.slice(0, 16) ?? '—'} → {data?.window.untilIso?.slice(0, 16) ?? '—'}
          </span>
          {kpis && tr ? (
            <span className="text-[var(--text-muted)]">
              issuance {tr.reports.arrow} {tr.reports.label} · minted links {tr.shares.arrow} {tr.shares.label}
            </span>
          ) : null}
        </div>
      </header>

      {err ? (
        <div className="mt-6 rounded border border-alert-red/40 bg-alert-red/10 px-4 py-3 font-mono text-sm text-alert-red">
          {err}
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Configure <code className="text-brass-400">FARTS_API_BASE_URL</code> and matching{' '}
            <code className="text-brass-400">OPS_CONSOLE_SECRET</code> on the Next server; backend must accept the
            same secret via <code className="text-brass-400">x-ops-key</code>.
          </p>
        </div>
      ) : null}

      {loading && !data ? (
        <p className="mt-10 font-mono text-sm text-[var(--text-muted)]">Pulling ledger from command…</p>
      ) : null}

      {kpis ? (
        <>
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-500">North-star rail</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                title="Share links / report (window)"
                subtitle="minted share durability ÷ issued dossiers"
                value={pct(kpis.shareRatePerReport)}
                accent="brass"
              />
              <KpiCard
                title="Challenges / report"
                subtitle="challenge_links ÷ reports"
                value={pct(kpis.challengeRatePerReport)}
                accent="teal"
              />
              <KpiCard
                title="Premium intents / report"
                subtitle="intents ÷ reports"
                value={pct(kpis.premiumIntentRatePerReport)}
                accent="amber"
              />
              <KpiCard
                title="Screenshot saves / report"
                subtitle="client share_download_succeeded ÷ reports"
                value={pct(kpis.screenshotSuccessRatePerReport)}
                accent="green"
              />
              <KpiCard
                title="Reports issued"
                subtitle="within window"
                value={kpis.reportsInWindow.toLocaleString()}
              />
              <KpiCard
                title="Share surface opens"
                subtitle="client share_view events"
                value={kpis.shareViewsInWindow.toLocaleString()}
              />
            </div>
          </section>

          <section className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-500">
                Propagation funnel
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Ceremonial ordering — counts are independent signals, not a strict user-level funnel.
              </p>
              <div className="mt-4">
                <FunnelRail steps={data?.funnel ?? []} />
              </div>
            </div>
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-500">Session field</h2>
              <div className="mt-4 space-y-3 rounded-lg border border-charcoal-600 bg-[var(--bg-panel)] p-4 font-mono text-sm">
                <Row label="Distinct sessions (reports)" value={kpis.sessionsDistinctOnReportsInWindow} />
                <Row label="New anonymous sessions" value={kpis.sessionsCreatedInWindow} />
                <Row label="Avg reports / active session" value={kpis.avgReportsPerActiveSession} />
                <Row label="Repeat sessions (multi-report)" value={kpis.repeatReportSessionsInWindow} />
                <Row label="Challenge opens (server)" value={kpis.challengeOpensInWindow} />
                <Row label="Challenge resolutions" value={kpis.challengeResolvedInWindow} />
                <Row label="Premium intents" value={kpis.premiumIntentsInWindow} />
                <Row label="Total reports (all time)" value={kpis.reportsTotal} />
              </div>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-500">Variant movement</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Rows keyed by persisted variant_id or classification. Client pivots (share_view) join on variantId
              strings when present.
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-charcoal-600">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-charcoal-600 bg-[var(--bg-panel-strong)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="px-3 py-2">Variant / class</th>
                    <th className="px-3 py-2 text-right">Issued</th>
                    <th className="px-3 py-2 text-right">Share views</th>
                    <th className="px-3 py-2 text-right">Screens</th>
                    <th className="px-3 py-2 text-right">Challenges</th>
                    <th className="px-3 py-2 text-right">Premium</th>
                    <th className="px-3 py-2 text-right">Share %</th>
                    <th className="w-8 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(data?.variants ?? []).map((v: OpsVariantRow) => {
                    const open = expanded === v.variantKey;
                    return (
                      <VariantTableRow
                        key={v.variantKey}
                        v={v}
                        open={open}
                        onToggle={() => {
                          if (open) {
                            setExpanded(null);
                          } else {
                            track('ops_variant_drilldown_opened', { variantKey: v.variantKey });
                            setExpanded(v.variantKey);
                          }
                        }}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-500">Recent field signals</h2>
            <ul className="mt-3 divide-y divide-charcoal-700 rounded-lg border border-charcoal-600 bg-[var(--bg-panel)] font-mono text-xs">
              {(data?.ledger ?? []).map((row) => (
                <li key={`${row.kind}-${row.ref}-${row.occurredAtIso}`} className="flex flex-wrap gap-2 px-3 py-2">
                  <span className="text-brass-500">{row.kind}</span>
                  <span className="text-[var(--text-muted)]">{row.occurredAtIso.replace('T', ' ').slice(0, 19)}Z</span>
                  <span className="text-[var(--text-strong)]">{row.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
