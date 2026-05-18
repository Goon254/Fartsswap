'use client';

import { useEffect, useState, type FC } from 'react';
import { getBuffer, subscribe, type AnalyticsRecord } from '@/lib/analytics';

const MAX_VISIBLE = 16;

/**
 * Floating dev panel that shows recent analytics events.
 *
 * Production-stripped via `process.env.NODE_ENV` check + the dead-code
 * elimination Next applies. In dev it appears as a small brass pill in the
 * bottom-right corner with an event counter; click to expand into a list
 * of the last 16 events. Esc collapses it.
 *
 * Intentionally styled with raw inline values so it can never accidentally
 * pick up a designer-facing token and "leak" into production builds.
 */
export const AnalyticsDebugPanel: FC = () => {
  if (process.env.NODE_ENV === 'production') return null;
  return <DevPanelInner />;
};

const DevPanelInner: FC = () => {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<readonly AnalyticsRecord[]>([]);

  useEffect(() => {
    setRecords(getBuffer());
    const unsub = subscribe(() => setRecords(getBuffer()));
    return unsub;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const visible = records.slice(-MAX_VISIBLE).reverse();

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 9999,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle analytics debug panel"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid rgba(217,178,106,0.4)',
          background: 'rgba(5,8,7,0.85)',
          color: '#d9b26a',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: 999,
            background: '#65a375',
          }}
        />
        ANALYTICS · {records.length}
      </button>
      {open ? (
        <div
          style={{
            marginTop: 8,
            width: 380,
            maxHeight: 480,
            overflow: 'auto',
            borderRadius: 6,
            border: '1px solid rgba(217,178,106,0.4)',
            background: 'rgba(13,21,19,0.96)',
            color: '#f5efe0',
            padding: 12,
            fontSize: 11,
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(245,239,224,0.12)',
              paddingBottom: 8,
              marginBottom: 8,
              color: '#d9b26a',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            <span>Bureau ops · event tape</span>
            <span style={{ color: '#9a9482' }}>last {Math.min(MAX_VISIBLE, records.length)}</span>
          </div>
          {visible.length === 0 ? (
            <div style={{ color: '#9a9482' }}>No events yet — interact with the page.</div>
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {visible.map((r, i) => (
                <li
                  key={r.timestamp + ':' + i}
                  style={{
                    padding: '6px 0',
                    borderBottom: '1px dashed rgba(245,239,224,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#2dbfaf', fontWeight: 600 }}>{r.name}</span>
                    <span style={{ color: '#5e6864' }}>{formatTime(r.iso)}</span>
                  </div>
                  <div style={{ color: '#c9c0a8', marginTop: 2, wordBreak: 'break-all' }}>
                    {Object.keys(r.payload).length === 0
                      ? '(no payload)'
                      : JSON.stringify(r.payload)}
                  </div>
                  <div style={{ color: '#5e6864', marginTop: 2 }}>
                    {r.context.route} · {r.context.viewport} · {r.context.theme}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
};

function formatTime(iso: string): string {
  // HH:MM:SS UTC, short enough to fit beside an event name.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
