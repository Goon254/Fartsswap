import type { FC } from 'react';

/**
 * Feature breakdown for the PDF certificate.
 *
 * Reads as a "what's included" panel, but with field codes + faint mono
 * captions so it lands as a procurement spec rather than a marketing
 * bullet list. Each line carries an AGD-prefixed reference that mirrors
 * the dossier codes used elsewhere on the lab.
 */
export const CertificateSpecList: FC = () => (
  <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2">
    {SPECS.map((spec) => (
      <li
        key={spec.code}
        className="group/spec flex flex-col gap-1 bg-[var(--bg-panel)] px-5 py-4"
      >
        <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span className="text-[var(--accent-brass)]">{spec.code}</span>
          <span aria-hidden="true" className="h-2.5 w-px bg-[var(--border-subtle)]" />
          <span>{spec.label}</span>
        </div>
        <div className="text-[0.95rem] leading-snug text-[var(--text-default)]">{spec.value}</div>
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
          {spec.detail}
        </div>
      </li>
    ))}
  </ul>
);

const SPECS = [
  {
    code: 'CRT-101',
    label: 'ARCHIVAL FORMATTING',
    value: 'A4 / Letter, 300 dpi, embedded fonts.',
    detail: 'Stable on Adobe, Preview, Foxit, and air-gapped print queues.',
  },
  {
    code: 'CRT-102',
    label: 'OFFICIAL SEAL',
    value: 'Vector Bureau seal, embossed in brass.',
    detail: 'Scales without aliasing; legible on a phone or a wall.',
  },
  {
    code: 'CRT-103',
    label: 'FILING NUMBER',
    value: 'Serial issued under §4.2 (Acoustic Records).',
    detail: 'Stable per dossier; replaces nothing, but feels like it might.',
  },
  {
    code: 'CRT-104',
    label: 'SIGNATURE BLOCK',
    value: 'Director / Filed / Station signatures.',
    detail: 'Engraved-style monospace; pen-style flourish reserved for v2.',
  },
  {
    code: 'CRT-105',
    label: 'PRINTABLE LAYOUT',
    value: 'Bleed-safe margins, vertical orientation.',
    detail: 'Frame at 8×10 or 11×14; both crop cleanly.',
  },
  {
    code: 'CRT-106',
    label: 'CEREMONIAL WATERMARK',
    value: '"FOR PRIVATE USE" diagonal, 3% opacity.',
    detail: 'Survives compression; disappears at arm\u2019s length.',
  },
  {
    code: 'CRT-107',
    label: 'DELUXE TYPOGRAPHY',
    value: 'Fraunces (display), Inter (UI), JetBrains Mono (codes).',
    detail: 'Three families. Sub-pixel hinting on the print pass.',
  },
  {
    code: 'CRT-108',
    label: 'TAMPER-EVIDENT HASH',
    value: 'SHA-style hash of the dossier, server-controlled.',
    detail: 'Identical to the hash on /report and the share card.',
  },
] as const;
