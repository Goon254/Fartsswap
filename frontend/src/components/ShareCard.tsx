'use client';

import { forwardRef } from 'react';
import { Seal } from '@/components/Seal';
import { Wordmark } from '@/components/Wordmark';
import type { ResultVariant, ThreatLevel } from '@/lib/result-variants';

interface ShareCardProps {
  variant: ResultVariant;
  /** Optional caption override; defaults to the variant's featured (№ 01) caption. */
  caption?: string;
  /** Force light/dark independent of the document theme (used for export). */
  forceTheme?: 'dark' | 'light';
  className?: string;
}

/**
 * The exportable artifact.
 *
 * Built at a fixed 1080×1920 internal size so the exported PNG is always
 * 1080×1920 × pixelRatio regardless of what the surrounding page does to
 * the preview. The preview wrapper (`<ShareCardStage />`) scales this
 * element down with `transform: scale(…)` so it fits on screen.
 *
 * This is intentionally NOT the dossier squeezed down — it's a poster:
 *   - one dominant typographic moment (CLASSIFICATION)
 *   - two supporting metric beats (score · threat)
 *   - one signal trace (waveform)
 *   - three short dossier lines (tone · cause · parallel)
 *   - one tactile advisory caption
 *   - a single watermark zone that "travels with the image"
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { variant, caption, forceTheme, className },
  ref,
) {
  const theme = forceTheme ?? 'dark';
  const featuredCaption = caption ?? variant.captions[0] ?? '';
  const threatTone = THREAT_TONES[variant.threatLevel];

  // Inline style so the same colors render correctly inside the html-to-image
  // canvas even when the document theme attribute is on <html> rather than
  // the captured subtree.
  const palette =
    theme === 'dark'
      ? {
          bg: '#050807',
          panel: '#0d1513',
          panelStrong: '#131e1c',
          textStrong: '#f5efe0',
          textDefault: '#e5dcc2',
          textMuted: '#9a9482',
          textFaint: '#5e6864',
          accentBrass: '#d9b26a',
          accentBrassSoft: '#b68b3a',
          accentTeal: '#2dbfaf',
          borderSubtle: 'rgba(245,239,224,0.10)',
          borderStark: 'rgba(245,239,224,0.20)',
          borderBrass: 'rgba(217,178,106,0.40)',
        }
      : {
          bg: '#fbf7ed',
          panel: '#ffffff',
          panelStrong: '#f5efe0',
          textStrong: '#050807',
          textDefault: '#131e1c',
          textMuted: '#5a6361',
          textFaint: '#8a918e',
          accentBrass: '#846423',
          accentBrassSoft: '#b68b3a',
          accentTeal: '#0e544c',
          borderSubtle: 'rgba(5,8,7,0.10)',
          borderStark: 'rgba(5,8,7,0.24)',
          borderBrass: 'rgba(132,100,35,0.45)',
        };

  // Render an SVG waveform inline so the exported PNG captures it without
  // depending on hover/animation state.
  const waveformBars = buildBarHeights(variant.waveformSeed, 92);

  return (
    <div
      ref={ref}
      className={[
        'relative isolate select-none overflow-hidden',
        'font-sans',
        className ?? '',
      ].join(' ')}
      style={{
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        backgroundColor: palette.bg,
        color: palette.textDefault,
      }}
      data-share-card="true"
    >
      {/* — Background layers — */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            theme === 'dark'
              ? `radial-gradient(ellipse 70% 45% at 50% 0%, rgba(45,191,175,0.18), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(217,178,106,0.10), transparent 70%)`
              : `radial-gradient(ellipse 70% 45% at 50% 0%, rgba(14,84,76,0.06), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(132,100,35,0.05), transparent 70%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${theme === 'dark' ? 'rgba(245,239,224,0.04)' : 'rgba(5,8,7,0.04)'} 1px, transparent 1px), linear-gradient(to bottom, ${theme === 'dark' ? 'rgba(245,239,224,0.04)' : 'rgba(5,8,7,0.04)'} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />
      {/* diagonal "FOR PRIVATE USE" plate, very faint */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute select-none font-display italic"
        style={{
          right: -120,
          top: 380,
          fontSize: 320,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: palette.textStrong,
          opacity: 0.03,
          transform: 'rotate(-12deg)',
          whiteSpace: 'nowrap',
        }}
      >
        PRIVATE
      </span>

      {/* — Corner crosshairs — */}
      <Cross color={palette.accentBrass} style={{ top: 32, left: 32 }} />
      <Cross color={palette.accentBrass} style={{ top: 32, right: 32, transform: 'rotate(90deg)' }} />
      <Cross color={palette.accentBrass} style={{ bottom: 32, left: 32, transform: 'rotate(-90deg)' }} />
      <Cross color={palette.accentBrass} style={{ bottom: 32, right: 32, transform: 'rotate(180deg)' }} />

      {/* — Content frame (inset within crosshairs) — */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '88px 88px 80px 88px' }}>
        {/* Header band */}
        <header className="flex items-end justify-between" style={{ borderBottom: `1px solid ${palette.borderSubtle}`, paddingBottom: 28 }}>
          <div className="flex flex-col gap-2">
            <div
              className="flex items-center gap-3 font-mono uppercase"
              style={{ fontSize: 16, letterSpacing: '0.22em', color: palette.accentBrass }}
            >
              <span style={{ display: 'inline-block', width: 36, height: 1, background: palette.accentBrass, opacity: 0.9 }} />
              <span>BUREAU OF ACOUSTIC GASOLOGY</span>
            </div>
            <div
              className="font-mono uppercase"
              style={{ fontSize: 14, letterSpacing: '0.22em', color: palette.textMuted }}
            >
              CASE FILE · <span style={{ color: palette.textDefault }}>{variant.caseFile}</span> · STATION OPS-04
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className="font-mono uppercase"
              style={{ fontSize: 12, letterSpacing: '0.22em', color: palette.textFaint }}
            >
              DOSSIER · vAlpha
            </div>
            <div
              className="font-mono uppercase"
              style={{ fontSize: 12, letterSpacing: '0.22em', color: palette.accentBrass }}
            >
              ISSUED · {formatIsoShort(variant.issuedAtIso)}
            </div>
          </div>
        </header>

        {/* — Title block — */}
        <section style={{ paddingTop: 48, paddingBottom: 36 }}>
          <div
            className="font-mono uppercase"
            style={{ fontSize: 14, letterSpacing: '0.22em', color: palette.textMuted }}
          >
            CLASSIFICATION №
          </div>
          <h1
            className="font-display"
            style={{
              marginTop: 8,
              fontSize: 132,
              lineHeight: 0.96,
              letterSpacing: '-0.025em',
              fontWeight: 500,
              color: palette.textStrong,
              textWrap: 'balance',
            } as React.CSSProperties}
          >
            {variant.classification}
          </h1>
          <div
            className="font-display italic"
            style={{
              marginTop: 18,
              fontSize: 30,
              lineHeight: 1.15,
              letterSpacing: '-0.015em',
              color: palette.textDefault,
            }}
          >
            {variant.subjectTitle}
          </div>
        </section>

        {/* — Score + Threat row — */}
        <section
          className="flex items-end justify-between"
          style={{ borderTop: `1px solid ${palette.borderSubtle}`, borderBottom: `1px solid ${palette.borderSubtle}`, padding: '24px 0' }}
        >
          <div className="flex flex-col">
            <div
              className="font-mono uppercase"
              style={{ fontSize: 13, letterSpacing: '0.22em', color: palette.textMuted }}
            >
              AGD-101 · POWER SCORE
            </div>
            <div className="flex items-baseline gap-3" style={{ marginTop: 4 }}>
              <span
                className="font-display"
                style={{
                  fontSize: 132,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  fontWeight: 500,
                  color: palette.textStrong,
                }}
              >
                {String(variant.powerScore).padStart(2, '0')}
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 16, letterSpacing: '0.18em', color: palette.textMuted }}
              >
                / 100
              </span>
            </div>
            <div
              style={{
                marginTop: 12,
                width: 280,
                height: 8,
                borderRadius: 999,
                background: palette.panelStrong,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${variant.powerScore}%`,
                  height: '100%',
                  background: palette.accentBrass,
                }}
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Pill color={threatTone(palette)} label={`THREAT · ${variant.threatLevel.toUpperCase()}`} />
            <div
              className="font-mono uppercase"
              style={{ fontSize: 13, letterSpacing: '0.22em', color: palette.textMuted }}
            >
              CONFIDENCE · {variant.confidenceLabel.toUpperCase()}
            </div>
            <div
              className="font-mono uppercase"
              style={{ fontSize: 13, letterSpacing: '0.22em', color: palette.accentBrass }}
            >
              {variant.genre ? variant.genre.toUpperCase() : 'UNCLASSIFIED'}
            </div>
            {variant.warningBadge ? (
              <Pill subdued color={palette.accentBrass} label={variant.warningBadge} />
            ) : null}
          </div>
        </section>

        {/* — Waveform — */}
        <section style={{ paddingTop: 22 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 13, letterSpacing: '0.22em', color: palette.textMuted }}
            >
              AGD-401 · SIGNAL TRACE
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 12, letterSpacing: '0.22em', color: palette.textFaint }}
            >
              {(variant.durationMs / 1000).toFixed(2)}s · MONO · 44.1 kHz
            </span>
          </div>
          <div
            style={{
              position: 'relative',
              height: 132,
              borderRadius: 8,
              border: `1px solid ${palette.borderSubtle}`,
              background: palette.panelStrong,
              padding: '20px 24px',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '0 24px',
                top: '50%',
                height: 1,
                marginTop: -1,
                background: palette.accentBrass,
                opacity: 0.25,
              }}
            />
            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', gap: 4 }}>
              {waveformBars.map((h, i) => (
                <span
                  key={i}
                  style={{
                    display: 'block',
                    width: 4,
                    height: `${h}%`,
                    borderRadius: 1,
                    background: palette.accentTeal,
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* — Dossier fields — */}
        <section
          className="grid"
          style={{
            marginTop: 28,
            gap: 18,
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <Field code="AGD-201" label="EMOTIONAL TONE" value={variant.emotionalTone} palette={palette} />
          <Field code="AGD-202" label="PROBABLE CAUSE" value={variant.probableCause} palette={palette} />
          <Field
            code="AGD-204"
            label="CINEMATIC PARALLEL"
            value={variant.cinematicParallel}
            palette={palette}
            italic
            span={2}
          />
        </section>

        {/* — Caption — */}
        <section
          style={{
            marginTop: 32,
            padding: '24px 28px',
            border: `1px solid ${palette.borderBrass}`,
            borderRadius: 8,
            background:
              theme === 'dark'
                ? 'rgba(217,178,106,0.06)'
                : 'rgba(132,100,35,0.04)',
          }}
        >
          <div
            className="font-mono uppercase"
            style={{ fontSize: 12, letterSpacing: '0.22em', color: palette.accentBrass, marginBottom: 8 }}
          >
            ADVISORY · FEATURED
          </div>
          <div
            className="font-display italic"
            style={{
              fontSize: 28,
              lineHeight: 1.2,
              letterSpacing: '-0.012em',
              color: palette.textStrong,
            }}
          >
            {`\u201C${featuredCaption}\u201D`}
          </div>
        </section>

        {/* — Footer (watermark, hash, seal) — */}
        <footer
          className="mt-auto flex items-end justify-between"
          style={{ paddingTop: 28, borderTop: `1px solid ${palette.borderSubtle}` }}
        >
          <div className="flex flex-col gap-2">
            <Wordmark size="lg" />
            <div
              className="font-mono uppercase"
              style={{ fontSize: 12, letterSpacing: '0.22em', color: palette.textMuted }}
            >
              farts.com · Bureau of Acoustic Gasology
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 13, letterSpacing: '0.05em', color: palette.textStrong, marginTop: 6, wordBreak: 'break-all' }}
            >
              HASH · {variant.reportHash}
            </div>
          </div>
          <div style={{ color: palette.accentBrass, opacity: 0.95 }}>
            <Seal size={140} />
          </div>
        </footer>
      </div>
    </div>
  );
});

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

/**
 * Wrapper that scales the fixed-size ShareCard to fit a responsive preview
 * area while keeping the underlying element at 1080×1920 (so html-to-image
 * always exports at poster-quality dimensions).
 */
export function ShareCardStage({
  scale,
  className,
  children,
}: {
  scale: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={['relative', className ?? ''].join(' ')}
      style={{
        width: SHARE_CARD_WIDTH * scale,
        height: SHARE_CARD_HEIGHT * scale,
      }}
    >
      <div
        style={{
          width: SHARE_CARD_WIDTH,
          height: SHARE_CARD_HEIGHT,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---- Internals ----

interface CardPalette {
  bg: string;
  panel: string;
  panelStrong: string;
  textStrong: string;
  textDefault: string;
  textMuted: string;
  textFaint: string;
  accentBrass: string;
  accentBrassSoft: string;
  accentTeal: string;
  borderSubtle: string;
  borderStark: string;
  borderBrass: string;
}

function Field({
  code,
  label,
  value,
  palette,
  italic,
  span,
}: {
  code: string;
  label: string;
  value: string;
  palette: CardPalette;
  italic?: boolean;
  span?: 1 | 2;
}) {
  return (
    <div
      style={{
        gridColumn: span === 2 ? 'span 2' : undefined,
        padding: '18px 22px',
        border: `1px solid ${palette.borderSubtle}`,
        background: palette.panel,
        borderRadius: 6,
      }}
    >
      <div
        className="font-mono uppercase"
        style={{ fontSize: 12, letterSpacing: '0.22em', color: palette.textMuted, marginBottom: 8 }}
      >
        <span style={{ color: palette.accentBrass }}>{code}</span>
        <span style={{ margin: '0 8px', color: palette.borderSubtle }}>·</span>
        <span>{label}</span>
      </div>
      <div
        className={italic ? 'font-display italic' : undefined}
        style={{
          fontSize: italic ? 26 : 22,
          lineHeight: 1.25,
          color: italic ? palette.textStrong : palette.textDefault,
          letterSpacing: italic ? '-0.012em' : '0',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Pill({
  color,
  label,
  subdued = false,
}: {
  color: string;
  label: string;
  subdued?: boolean;
}) {
  return (
    <span
      className="font-mono uppercase"
      style={{
        fontSize: 13,
        letterSpacing: '0.22em',
        padding: '6px 12px',
        borderRadius: 4,
        background: subdued ? 'transparent' : `color-mix(in oklab, ${color} 18%, transparent)`,
        color: color,
        border: subdued ? `1px solid ${color}` : `1px solid color-mix(in oklab, ${color} 45%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

function Cross({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ position: 'absolute', color, opacity: 0.85, ...style }}
    >
      <path d="M0 0 L12 0 L12 2 L2 2 L2 12 L0 12 Z" fill="currentColor" />
    </svg>
  );
}

const THREAT_TONES: Record<
  ThreatLevel,
  (p: CardPalette) => string
> = {
  Green: () => '#65a375',
  Amber: () => '#d9a23a',
  Red: () => '#c8453a',
  Cerulean: () => '#4aa7c8',
};

function formatIsoShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Deterministic bar heights seeded by the variant. SSR + CSR agree, and each
 * variant produces a visibly distinct silhouette.
 */
function buildBarHeights(seed: number, count: number): number[] {
  let s = (seed >>> 0) || 1;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const envA = Math.sin((i / count) * Math.PI) * 0.7;
    const envB = Math.sin((i / count) * Math.PI * 3) * 0.3;
    const env = Math.max(0.18, envA + envB);
    heights.push(Math.round((25 + r * 70) * env));
  }
  return heights;
}
