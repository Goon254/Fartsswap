# Farts.com — Frontend

Public web client for the Bureau of Acoustic Gasology.

Phase 1: editorial landing page (this commit). Subsequent phases will wire the
record / fake-generate flows against the backend at `../backend`.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 (CSS-first `@theme`)
- Framer Motion (sequenced reveal + hover behaviour)
- `next/font/google` for self-hosted Fraunces / Inter / JetBrains Mono

## Quick start

```bash
cd frontend
npm install
npm run dev    # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Quality gates

```bash
npm run typecheck   # strict tsc --noEmit
npm run lint        # next lint
npm run build       # next build (also runs typecheck)
```

## Design notes

The brand is "premium clinical parody". Visually:

- **Dark by default.** Near-black charcoal background with subtle grid + noise
  + radial glow layers (`<BackgroundLayers />`).
- **Palette:** deep teal accents, muted brass for emphasis, ivory text
  highlights, alert tones for status chips.
- **Typography:** Fraunces (editorial serif) for display, Inter for UI/body,
  JetBrains Mono for institutional microcopy + hashes.
- **Theme toggle:** swaps to an ivory-paper light variant via `data-theme`
  attribute. Both modes are first-class.

The deadpan tone is the whole brand — the design must look like a serious
interface for something ridiculous. No emojis, no purple gradients, no
cartoonish flourishes.

## Folder layout

```
src/
  app/
    layout.tsx       fonts + metadata + theme bootstrap
    page.tsx         landing page composition
    globals.css      Tailwind v4 @theme tokens + base styles
  components/
    Navbar.tsx
    Hero.tsx
    ReportPreviewCard.tsx
    FeatureGrid.tsx
    FooterLoreStrip.tsx
    BackgroundLayers.tsx
    Button.tsx
    Chip.tsx
    Wordmark.tsx
    Seal.tsx
    Waveform.tsx
    ThemeToggle.tsx
    SectionLabel.tsx
  lib/
    data.ts          dummy report fields for the preview card
    motion.ts        shared Framer variants + transitions
```
