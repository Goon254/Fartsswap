# Farts.com — Frontend

Public web client for the Bureau of Acoustic Gasology (Next.js App Router).

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- Framer Motion

## Quick start

```bash
cd frontend
npm install
npm run dev    # http://localhost:3000
```

Run the Nest API on another port if needed (see **Environment**). Example:

```bash
# terminal 1 — API (repo root backend/)
npm run start:dev

# terminal 2 — web (defaults FARTS_API_BASE_URL to http://127.0.0.1:3000 in dev)
cd frontend && npm run dev -p 3001
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
npm run build       # next build
```

## Environment

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `FARTS_API_BASE_URL` | Server (BFF routes) | **Yes in production/staging** | Origin of the Nest API (e.g. `https://api.staging.example.com`). Dev default: `http://127.0.0.1:3000` via `src/lib/upstream-proxy.ts`. |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | Client | No | Overrides analytics POST target. Default: same-origin `/api/analytics/events` (BFF). |
| `NEXT_PUBLIC_CAPTURE_MODE` | Client | No | Set to `simulated` to disable live microphone on `/analyze`. Default: live (WebM via MediaRecorder). |
| `NEXT_PUBLIC_LAUNCH_MODE` | Client | No | `true` = waitlist launch shell on `/`; `false` or unset = **live** landing (default). Preview old shell at `/launch`. |

Copy `frontend/.env.example` to `frontend/.env.local` for local overrides.

**Session cookies:** Integrated BFF handlers forward the browser `Cookie` header to the API and pass through upstream `Set-Cookie`. Users should hit **only the Next.js origin** in the browser; do not point the client at the API host directly for these flows.

## Backend proxy (BFF)

Same-origin App Router handlers forward requests to `/api/v1/...` on the Nest API using `src/lib/upstream-proxy.ts` (`resolveUpstreamBaseUrl`, cookie forward, `Set-Cookie` passthrough).

### Core loop (integrated client helpers)

| Next.js route | Upstream | Client helper |
| --- | --- | --- |
| `POST /api/audio/uploads` | `POST /api/v1/audio/uploads` | `uploadAudio` — `src/lib/report-from-recording-api.ts` |
| `POST /api/reports/from-audio` | `POST /api/v1/reports/from-audio` | `createReportFromAudio` |
| `GET /api/reports/[reportId]` | `GET /api/v1/reports/:id` | `fetchReportById` |
| `POST /api/reports/[reportId]/artifacts/[[...path]]` | `POST /api/v1/reports/:id/artifacts/...` | `createReportArtifact` — `src/lib/artifact-api.ts` |
| `GET /api/artifacts/[[...path]]` | `GET /api/v1/artifacts/...` | `fetchArtifactByPath`, `rewriteArtifactContentUrlToProxy` |
| `POST /api/reports/[reportId]/shares` | `POST /api/v1/reports/:id/shares` | `createReportShareLink` — `src/lib/share-api.ts` |
| `POST /api/challenges` | `POST /api/v1/challenges` | `createChallenge` — `src/lib/challenge-api.ts` |
| `GET /api/challenges/[challengeId]` | `GET /api/v1/challenges/:id` | `fetchChallengeById` |
| `POST /api/challenges/[challengeId]/open` | `POST /api/v1/challenges/:id/open` | `openChallenge` |
| `POST /api/challenges/[challengeId]/resolve` | `POST /api/v1/challenges/:id/resolve` | `resolveChallenge` |
| `POST /api/premium/intents` | `POST /api/v1/premium/intents` | `recordPremiumIntent` — `src/lib/premium-api.ts` |
| `POST /api/analytics/events` | `POST /api/v1/analytics/events` | `track` / `pageView` — `src/lib/analytics.ts` (default transport) |

Types shared with the API live in `src/lib/farts-api-types.ts`.

Older lab/ops proxies under `src/app/api/ops/`, `gallery/`, etc. may use inline `FARTS_API_BASE_URL ?? http://127.0.0.1:3000` — still set `FARTS_API_BASE_URL` in staging so nothing points at localhost.

## Browser / runtime notes

- **Live recording** (`/analyze` → record path): requires `MediaRecorder` + WebM (Chrome/Chromium recommended) and `getUserMedia` over **HTTPS** (or localhost).
- **Simulated capture:** set `NEXT_PUBLIC_CAPTURE_MODE=simulated` for demos without a microphone.
- **Persisted flows** use `?reportId=` on `/report` for server-backed share card, share link, challenge registration, and artifact commerce strip.

## Staging deployment checklist

Manual verification before calling staging “ready”:

1. **Config:** `FARTS_API_BASE_URL` set on the Next server to the reachable API origin; rebuild/restart after env changes.
2. **Record → report:** `/analyze` → live capture → analysis → land on `/report?reportId=…` with merged dossier fields.
3. **Share card:** On a persisted report, “Save share card” opens proxied artifact content (session cookie present).
4. **Share link:** “Copy share link” copies a `/report?reportId=…&share=…` URL.
5. **Challenge:** From report, open challenge link; persisted `ch_…` id loads, open/resolve events do not break UX; accept navigates to analyze with context.
6. **Premium intent:** “Upgrade to Official PDF” still navigates to `/premium`; intent POST succeeds in network tab (non-blocking on failure).
7. **Analytics:** DevTools → `POST /api/analytics/events` returns 2xx; optional override via `NEXT_PUBLIC_ANALYTICS_ENDPOINT` still works if set.
8. **Cookies:** Anonymous session cookie set on first API-touching action; subsequent BFF calls include `Cookie`.

## Intentionally incomplete (not staging blockers for core loop)

- Share-page premium CTA not wired to `recordPremiumIntent` (report action row only).
- Analytics batch ingest (`/api/v1/analytics/events/batch`) has no BFF route.
- Safari / non-WebM live recording not supported beyond capability guards.
- Artifact commerce checkout remains stub/lab-oriented where not part of the table above.

## Design notes

Premium clinical parody: dark default, teal/brass accents, Fraunces + Inter + JetBrains Mono. See `src/app/globals.css` for tokens.
