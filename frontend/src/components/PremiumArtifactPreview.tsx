'use client';

import { motion } from 'framer-motion';
import { useCallback, type FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import { fileNumberForVariant } from '@/lib/premium';
import type { ResultVariant } from '@/lib/result-variants';

interface PremiumArtifactPreviewProps {
  variant: ResultVariant;
  /** Forwarded so the parent can fire premium_preview_interacted on hover. */
  onPreviewInteracted?: (
    previewType: 'pdf_certificate' | 'wall_certificate' | 'theme_pack',
  ) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Gallery of premium artifact previews.
 *
 * Three tiles, each visually distinct from the existing share-card poster:
 *
 *   1. PDF Certificate    — vertical A4 proportion, document-like, ivory
 *                            paper with embossed seal + signature block.
 *   2. Wall Certificate   — landscape, ornate corners, central seal,
 *                            "PRESENTED TO" framing.
 *   3. Theme Pack         — three mini share-card chips in different theme
 *                            palettes, hinting at the upgrade content.
 *
 * Previews are visual only — no PNG export, no download. They sit at half
 * scale on the page so two fit beside the PDF on desktop and stack cleanly
 * on mobile.
 */
export const PremiumArtifactPreview: FC<PremiumArtifactPreviewProps> = ({
  variant,
  onPreviewInteracted,
}) => {
  const handleHover = useCallback(
    (type: 'pdf_certificate' | 'wall_certificate' | 'theme_pack') => () => {
      onPreviewInteracted?.(type);
    },
    [onPreviewInteracted],
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-2 pt-12 lg:px-10 lg:pt-16">
      <div className="mb-6 flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
          §09
        </span>
        <span>SAMPLE ISSUES · ARCHIVAL SPECIMENS</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
        <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
          PREVIEW ONLY · NOT DOWNLOADABLE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* PDF certificate — the centrepiece */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          onMouseEnter={handleHover('pdf_certificate')}
          className="self-start"
        >
          <PdfCertificatePreview variant={variant} />
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
            onMouseEnter={handleHover('wall_certificate')}
          >
            <WallCertificatePreview variant={variant} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.14 }}
            onMouseEnter={handleHover('theme_pack')}
          >
            <ThemePackPreview variant={variant} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 1. PDF Certificate preview
// ---------------------------------------------------------------------------

const PdfCertificatePreview: FC<{ variant: ResultVariant }> = ({ variant }) => {
  const fileNumber = fileNumberForVariant(variant.id);

  return (
    <figure className="flex flex-col gap-3">
      <PreviewFrameHeader
        leading="SPECIMEN A · PDF CERTIFICATE"
        trailing="A4 · 1:√2"
      />
      <div
        className={[
          'relative isolate aspect-[1/1.414] overflow-hidden rounded-md',
          'border border-[var(--border-stark)]',
          'shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]',
        ].join(' ')}
        style={{
          background:
            'linear-gradient(180deg, #fbf7ed 0%, #f5efe0 100%)',
          color: '#1f2a28',
        }}
        aria-label="Sample PDF certificate"
      >
        {/* Paper grain */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-noise opacity-[0.06]"
        />
        {/* Diagonal "FOR PRIVATE USE" ghost */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ transform: 'rotate(-12deg)' }}
        >
          <span
            className="font-display italic"
            style={{
              fontSize: 'min(18vw, 9rem)',
              color: '#5a4416',
              opacity: 0.05,
              letterSpacing: '-0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            FOR PRIVATE USE
          </span>
        </span>

        {/* Corner crosshairs */}
        <PaperCross style={{ top: 12, left: 12 }} />
        <PaperCross style={{ top: 12, right: 12, transform: 'rotate(90deg)' }} />
        <PaperCross style={{ bottom: 12, left: 12, transform: 'rotate(-90deg)' }} />
        <PaperCross style={{ bottom: 12, right: 12, transform: 'rotate(180deg)' }} />

        <div className="relative z-10 flex h-full flex-col p-6 sm:p-8">
          {/* Header */}
          <header className="flex items-start justify-between border-b border-[#1f2a28]/15 pb-4">
            <div className="font-mono text-[0.55rem] uppercase tracking-wide-3" style={{ color: '#846423' }}>
              <div>BUREAU OF ACOUSTIC GASOLOGY</div>
              <div className="mt-0.5 text-[#5a6361]">STATION OPS-04 · MMXXVI</div>
            </div>
            <div className="text-right font-mono text-[0.55rem] uppercase tracking-wide-3" style={{ color: '#846423' }}>
              <div>SERIAL №</div>
              <div className="text-[0.65rem] text-[#1f2a28]">{fileNumber}</div>
            </div>
          </header>

          {/* Title */}
          <div className="mt-6">
            <div
              className="font-mono text-[0.55rem] uppercase tracking-wide-3"
              style={{ color: '#846423' }}
            >
              OFFICIAL CERTIFICATION OF ACOUSTIC EVENT
            </div>
            <h2
              className="mt-2 font-display"
              style={{
                fontSize: 'clamp(1.45rem, 4vw, 2.4rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
                color: '#1f2a28',
                fontWeight: 500,
              }}
            >
              {variant.classification}
            </h2>
            <div
              className="mt-1 font-display italic"
              style={{
                fontSize: 'clamp(0.85rem, 1.6vw, 1.05rem)',
                color: '#3a4644',
              }}
            >
              {variant.subjectTitle}
            </div>
          </div>

          {/* Field block */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-[0.7rem]">
            <FieldRow label="Power Score" value={`${variant.powerScore} / 100`} />
            <FieldRow label="Threat" value={variant.threatLevel} />
            <FieldRow
              label="Probable Cause"
              value={variant.probableCause}
              span
            />
            <FieldRow
              label="Cinematic Parallel"
              value={variant.cinematicParallel}
              span
            />
          </dl>

          {/* Hash strip */}
          <div className="mt-auto">
            <div
              className="mb-4 font-mono text-[0.55rem] uppercase tracking-wide-3"
              style={{ color: '#5a6361' }}
            >
              HASH · <span className="text-[#1f2a28]">{variant.reportHash}</span>
            </div>
            <div className="flex items-end justify-between border-t border-[#1f2a28]/15 pt-3">
              <div className="flex items-center gap-3" style={{ color: '#846423' }}>
                <Seal size={56} />
                <div>
                  <div
                    className="font-mono text-[0.5rem] uppercase tracking-wide-3"
                    style={{ color: '#846423' }}
                  >
                    CERTIFIED
                  </div>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 14,
                      letterSpacing: '0.04em',
                      color: '#1f2a28',
                      fontWeight: 500,
                    }}
                  >
                    B·A·G
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="font-display"
                  style={{
                    fontStyle: 'italic',
                    fontSize: '0.9rem',
                    borderBottom: '1px solid #1f2a28',
                    paddingBottom: 2,
                    width: '8rem',
                    textAlign: 'right',
                    color: '#1f2a28',
                  }}
                >
                  L. Methane
                </div>
                <div
                  className="mt-1 font-mono text-[0.55rem] uppercase tracking-wide-3"
                  style={{ color: '#5a6361' }}
                >
                  Director · §4.2
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        SPECIMEN A · scale 1:1 · ink-safe margins
      </figcaption>
    </figure>
  );
};

const FieldRow: FC<{ label: string; value: string; span?: boolean }> = ({ label, value, span }) => (
  <div className={span ? 'col-span-2' : undefined}>
    <dt
      className="font-mono text-[0.55rem] uppercase tracking-wide-3"
      style={{ color: '#846423' }}
    >
      {label}
    </dt>
    <dd
      className="mt-0.5"
      style={{
        color: '#1f2a28',
        fontSize: '0.95rem',
        lineHeight: 1.25,
      }}
    >
      {value}
    </dd>
  </div>
);

// ---------------------------------------------------------------------------
// 2. Wall Certificate preview (landscape, decorative)
// ---------------------------------------------------------------------------

const WallCertificatePreview: FC<{ variant: ResultVariant }> = ({ variant }) => {
  const fileNumber = fileNumberForVariant(variant.id).replace('CERT', 'WALL');

  return (
    <figure className="flex flex-col gap-3">
      <PreviewFrameHeader
        leading="SPECIMEN B · WALL CERTIFICATE"
        trailing="LANDSCAPE · 8×10 SAFE"
      />
      <div
        className="relative isolate aspect-[10/7] overflow-hidden rounded-md border border-[var(--border-stark)] shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]"
        style={{
          background:
            'linear-gradient(180deg, #faf3e7 0%, #f0e6cd 100%)',
          color: '#2a1a0f',
        }}
        aria-label="Sample printable wall certificate"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-noise opacity-[0.07]"
        />

        {/* Decorative border */}
        <div
          aria-hidden="true"
          className="absolute inset-2 rounded-sm border"
          style={{ borderColor: '#5b1018' }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-[10px] rounded-sm border"
          style={{ borderColor: '#5b1018', opacity: 0.35 }}
        />

        {/* Corner ornaments */}
        <CornerOrnament style={{ top: 12, left: 12 }} />
        <CornerOrnament style={{ top: 12, right: 12, transform: 'scaleX(-1)' }} />
        <CornerOrnament style={{ bottom: 12, left: 12, transform: 'scaleY(-1)' }} />
        <CornerOrnament style={{ bottom: 12, right: 12, transform: 'scale(-1)' }} />

        <div className="relative z-10 flex h-full flex-col items-center justify-between px-8 pb-6 pt-8 text-center">
          <div>
            <div
              className="font-mono text-[0.55rem] uppercase tracking-wide-3"
              style={{ color: '#5b1018' }}
            >
              CERTIFICATE OF ACOUSTIC SIGNIFICANCE
            </div>
            <h2
              className="mt-2 font-display italic"
              style={{
                fontSize: 'clamp(1.4rem, 3.2vw, 2.1rem)',
                color: '#2a1a0f',
                lineHeight: 1.05,
                letterSpacing: '-0.015em',
                fontWeight: 500,
              }}
            >
              Hereby presented in formal recognition of
            </h2>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-wide-3"
              style={{ color: '#5b1018' }}
            >
              <Rule />
              CLASSIFICATION
              <Rule />
            </div>
            <div
              className="mt-2 font-display"
              style={{
                fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)',
                color: '#2a1a0f',
                letterSpacing: '-0.015em',
                fontWeight: 500,
              }}
            >
              {variant.classification}
            </div>
            <div
              className="mt-1 font-display italic"
              style={{
                fontSize: '0.85rem',
                color: '#5b1018',
              }}
            >
              {variant.subjectTitle}
            </div>
          </div>

          <div className="grid w-full grid-cols-3 items-end gap-4 text-[0.55rem]">
            <SigBlock label="Director" name="L. Methane" />
            <div className="flex flex-col items-center">
              <div style={{ color: '#5b1018' }}>
                <Seal size={56} />
              </div>
              <div
                className="mt-1 font-mono uppercase tracking-wide-3"
                style={{ color: '#5b1018' }}
              >
                STATION OPS-04
              </div>
            </div>
            <SigBlock label="Filed" name="A. Velvetine" right />
          </div>

          <div
            className="mt-2 font-mono text-[0.5rem] uppercase tracking-wide-3"
            style={{ color: '#7a5333' }}
          >
            SERIAL № {fileNumber} · MMXXVI
          </div>
        </div>
      </div>
      <figcaption className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        SPECIMEN B · crops cleanly at 8×10 and 11×14
      </figcaption>
    </figure>
  );
};

const SigBlock: FC<{ label: string; name: string; right?: boolean }> = ({ label, name, right }) => (
  <div className={right ? 'text-right' : ''}>
    <div
      className="font-display italic"
      style={{
        color: '#2a1a0f',
        fontSize: '0.9rem',
        borderBottom: '1px solid #2a1a0f',
        paddingBottom: 2,
      }}
    >
      {name}
    </div>
    <div
      className="mt-1 font-mono uppercase tracking-wide-3"
      style={{ color: '#5b1018' }}
    >
      {label}
    </div>
  </div>
);

const Rule: FC = () => (
  <span aria-hidden="true" style={{ display: 'inline-block', width: 12, height: 1, background: '#5b1018' }} />
);

const CornerOrnament: FC<{ style: React.CSSProperties }> = ({ style }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{ position: 'absolute', color: '#5b1018', opacity: 0.8, ...style }}
  >
    <path d="M0 1 H10 M0 1 V10 M3 4 H8 M4 3 V8" stroke="currentColor" strokeWidth="0.8" fill="none" />
    <circle cx="3" cy="3" r="1.4" fill="currentColor" />
  </svg>
);

// ---------------------------------------------------------------------------
// 3. Theme pack preview
// ---------------------------------------------------------------------------

const ThemePackPreview: FC<{ variant: ResultVariant }> = ({ variant }) => (
  <figure className="flex flex-col gap-3">
    <PreviewFrameHeader leading="SPECIMEN C · THEME PACK" trailing="3 INCLUDED" />
    <div
      className="relative isolate overflow-hidden rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5 shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]"
      aria-label="Sample premium theme pack"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          PREMIUM SHARE-CARD THEMES
        </div>
        <Chip tone="brass">{variant.classification.toUpperCase()}</Chip>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((theme) => (
          <div
            key={theme.code}
            className="flex flex-col gap-2 overflow-hidden rounded-sm border border-[var(--border-subtle)]"
            style={{ background: theme.bg, color: theme.fg }}
          >
            <div
              className="flex items-center justify-between px-2 py-1.5 font-mono text-[0.5rem] uppercase tracking-wide-3"
              style={{ background: theme.accent, color: theme.accentText }}
            >
              <span>BUREAU</span>
              <span>{theme.code}</span>
            </div>
            <div className="px-2 pb-2">
              <div
                className="font-display"
                style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.95rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.015em',
                  fontWeight: 500,
                }}
              >
                {variant.classification}
              </div>
              <div
                className="mt-1 font-mono uppercase tracking-wide-3"
                style={{ fontSize: '0.5rem', color: theme.muted }}
              >
                {theme.name}
              </div>
              <div
                className="mt-2 h-1 w-full overflow-hidden rounded-full"
                style={{ background: theme.muted, opacity: 0.4 }}
              >
                <div
                  style={{
                    width: `${variant.powerScore}%`,
                    height: '100%',
                    background: theme.accent,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        <span>UNLOCKS · 3 SHARE-CARD VARIANTS</span>
        <span>SAME CONTENT · DIFFERENT JURISDICTION</span>
      </div>
    </div>
    <figcaption className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
      SPECIMEN C · enables Clinical Gold, Courtroom, Space Agency on /share
    </figcaption>
  </figure>
);

const THEMES = [
  {
    code: 'CG',
    name: 'Clinical Gold',
    bg: '#faf8f2',
    fg: '#0b1320',
    accent: '#0b1320',
    accentText: '#f5c264',
    muted: '#7a6a3f',
  },
  {
    code: 'CR',
    name: 'Courtroom',
    bg: '#faf3e7',
    fg: '#2a1a0f',
    accent: '#5b1018',
    accentText: '#f6e6c8',
    muted: '#7a5333',
  },
  {
    code: 'SA',
    name: 'Space Agency',
    bg: '#f8fafc',
    fg: '#0f172a',
    accent: '#020617',
    accentText: '#22d3ee',
    muted: '#475569',
  },
] as const;

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const PreviewFrameHeader: FC<{ leading: string; trailing: string }> = ({ leading, trailing }) => (
  <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3">
    <span className="text-[var(--accent-brass)]">{leading}</span>
    <span className="text-[var(--text-faint)]">{trailing}</span>
  </div>
);

const PaperCross: FC<{ style: React.CSSProperties }> = ({ style }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    aria-hidden="true"
    style={{ position: 'absolute', color: '#846423', opacity: 0.6, ...style }}
  >
    <path d="M0 0 H6 V1 H1 V6 H0 Z" fill="currentColor" />
  </svg>
);

