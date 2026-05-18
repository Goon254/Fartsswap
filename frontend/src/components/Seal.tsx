import type { FC } from 'react';

interface SealProps {
  size?: number;
  className?: string;
}

/**
 * Bureau institutional seal — concentric rings, set text on the upper arc,
 * "BAG" monogram in the centre, "EST. 2026" on the lower arc.
 *
 * Pure SVG so it scales crisply, prints into PDFs (when reused server-side),
 * and respects the active theme tokens via `currentColor`. Use a wrapping
 * `text-[var(--accent-brass)]` to colour it.
 */
export const Seal: FC<SealProps> = ({ size = 96, className }) => {
  const id = 'seal-arc-top';
  const idBottom = 'seal-arc-bottom';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <path id={id} d="M 14 60 A 46 46 0 0 1 106 60" fill="none" />
        <path id={idBottom} d="M 14 60 A 46 46 0 0 0 106 60" fill="none" />
      </defs>

      {/* outer ring */}
      <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      {/* inner ring */}
      <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
      {/* hairline notches */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 360) / 36;
        return (
          <line
            key={i}
            x1="60"
            y1="6"
            x2="60"
            y2="10"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.45"
            transform={`rotate(${angle} 60 60)`}
          />
        );
      })}

      {/* arc text — top */}
      <text
        fontSize="6"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        letterSpacing="2.6"
        fill="currentColor"
      >
        <textPath href={`#${id}`} startOffset="0%">
          BUREAU · OF · ACOUSTIC · GASOLOGY
        </textPath>
      </text>

      {/* arc text — bottom */}
      <text
        fontSize="5"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        letterSpacing="3"
        fill="currentColor"
        opacity="0.7"
      >
        <textPath href={`#${idBottom}`} startOffset="22%">
          EST · MMXXVI · STATION · OPS-04
        </textPath>
      </text>

      {/* centre monogram */}
      <g transform="translate(60 60)">
        <circle r="18" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        <text
          textAnchor="middle"
          y="3"
          fontSize="12"
          fontFamily="'Fraunces', ui-serif, serif"
          fontWeight="500"
          fill="currentColor"
          letterSpacing="1"
        >
          B·A·G
        </text>
        <text
          textAnchor="middle"
          y="13"
          fontSize="3.4"
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          fill="currentColor"
          opacity="0.6"
          letterSpacing="1.5"
        >
          CERTIFIED
        </text>
      </g>
    </svg>
  );
};
