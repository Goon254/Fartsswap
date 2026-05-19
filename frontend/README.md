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

## Backend proxy (BFF)

Same-origin App Router handlers forward selected routes to the Nest API. Set **`FARTS_API_BASE_URL`** to the backend origin (for example `http://127.0.0.1:3000` if the API listens there). In **production** this variable is required; in local dev it defaults to `http://127.0.0.1:3000` when unset (run Next on another port, e.g. `next dev -p 3001`, if that port is already used by the API).

Proxies forward the browser **`Cookie`** header to the API and return upstream **`Set-Cookie`** headers so anonymous sessions work without signup.

| Next.js route | Upstream |
| --- | --- |
| `POST /api/audio/uploads` | `POST /api/v1/audio/uploads` (multipart body streamed; preserves `Content-Type` boundary) |
| `POST /api/reports/from-audio` | `POST /api/v1/reports/from-audio` (JSON body; forwards optional `Idempotency-Key`) |

Shared helpers live in `src/lib/upstream-proxy.ts` for additional proxies (GET report, artifacts, etc.).

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
