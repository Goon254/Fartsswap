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

**Staging / launch:** See [`LAUNCH.md`](./LAUNCH.md) for env tables, untracked critical paths, ops moderation flow, and manual smoke tests.

**Session cookies:** Integrated BFF handlers forward the browser `Cookie` header to the API and pass through upstream `Set-Cookie`. Users should hit **only the Next.js origin** in the browser; do not point the client at the API host directly for these flows.

**Private specimen playback:** `/report?reportId=…` can show a session-only `<audio>` block when the API sets `playbackAvailable: true`. The browser loads same-origin `GET /api/reports/:id/audio` (BFF → Nest). On the API, keep `AUDIO_AUTO_DELETE_AFTER_PROCESSING=false` (default) so raw uploads remain in object storage after dossier creation; if set to `true`, playback and feed audio will fail after processing by design.

## Backend proxy (BFF)

Same-origin App Router handlers forward requests to `/api/v1/...` on the Nest API using `src/lib/upstream-proxy.ts` (`resolveUpstreamBaseUrl`, cookie forward, `Set-Cookie` passthrough).

### Core loop (integrated client helpers)

| Next.js route | Upstream | Client helper |
| --- | --- | --- |
| `POST /api/audio/uploads` | `POST /api/v1/audio/uploads` | `uploadAudio` — `src/lib/report-from-recording-api.ts` |
| `POST /api/reports/from-audio` | `POST /api/v1/reports/from-audio` | `createReportFromAudio` |
| `GET /api/reports/[reportId]` | `GET /api/v1/reports/:id` | `fetchReportById` |
| `GET /api/reports/[reportId]/audio` | `GET /api/v1/reports/:id/audio` | `buildReportAudioPlaybackUrl` — session-private specimen replay on `/report` |
| `POST /api/reports/[reportId]/artifacts/[[...path]]` | `POST /api/v1/reports/:id/artifacts/...` | `createReportArtifact` — `src/lib/artifact-api.ts` |
| `GET /api/artifacts/[[...path]]` | `GET /api/v1/artifacts/...` | `fetchArtifactByPath`, `rewriteArtifactContentUrlToProxy` |
| `POST /api/reports/[reportId]/shares` | `POST /api/v1/reports/:id/shares` | `createReportShareLink` — `src/lib/share-api.ts` |
| `POST /api/challenges` | `POST /api/v1/challenges` | `createChallenge` — `src/lib/challenge-api.ts` |
| `GET /api/challenges/[challengeId]` | `GET /api/v1/challenges/:id` | `fetchChallengeById` |
| `POST /api/challenges/[challengeId]/open` | `POST /api/v1/challenges/:id/open` | `openChallenge` |
| `POST /api/challenges/[challengeId]/resolve` | `POST /api/v1/challenges/:id/resolve` | `resolveChallenge` |
| `GET /api/challenges/[challengeId]/challenger-audio` | `GET /api/v1/challenges/:id/challenger-audio` | challenge dossier playback (public, challenge-scoped) |
| `GET /api/challenges/[challengeId]/response-audio` | `GET /api/v1/challenges/:id/response-audio` | counter-specimen playback |
| `POST /api/premium/intents` | `POST /api/v1/premium/intents` | `recordPremiumIntent` — `src/lib/premium-api.ts` |
| `POST /api/analytics/events` | `POST /api/v1/analytics/events` | `track` / `pageView` — `src/lib/analytics.ts` (default transport) |
| `GET /api/gallery/feed` | `GET /api/v1/gallery/feed` | `fetchPublicFeed` — `src/lib/gallery-api.ts` |
| `GET /api/gallery/feed/[submissionId]/audio` | `GET /api/v1/gallery/feed/:id/audio` | `buildGalleryFeedAudioUrl` — published feed audio only |
| `POST /api/gallery/submissions` | `POST /api/v1/gallery/submissions` | `submitReportToGallery` |
| `POST /api/gallery/reports` | `POST /api/v1/gallery/reports` | `fileGalleryFeedReport` — anonymous session, one report per item |
| `GET /api/gallery/submissions/by-report/[reportId]` | same upstream | `fetchGallerySubmissionForReport` |
| `POST /api/ops/gallery/*` | `POST /api/v1/ops/gallery/*` | `/moderation-lab` — requires `x-ops-key` / `OPS_CONSOLE_SECRET` |

Types shared with the API live in `src/lib/farts-api-types.ts`.

**Public feed:** Page `/feed` lists operator-published gallery items. API must set `GALLERY_PUBLIC_FEED_ENABLED=true` and `GALLERY_SUBMISSIONS_ENABLED=true`. Users opt in from `/report` (“Post to public feed” on audio dossiers); ops approve + publish via `/moderation-lab` (`approve` then `publish`). Viewers can **Report specimen** on `/feed` (no account). Public feed audio uses submission-scoped URLs, not private report playback routes.

Older lab/ops proxies under `src/app/api/ops/`, `gallery/`, etc. may use inline `FARTS_API_BASE_URL ?? http://127.0.0.1:3000` — still set `FARTS_API_BASE_URL` in staging so nothing points at localhost.

## Browser / runtime notes

- **Live recording** (`/analyze` → record path): requires `MediaRecorder` + WebM (Chrome/Chromium recommended) and `getUserMedia` over **HTTPS** (or localhost).
- **Simulated capture:** set `NEXT_PUBLIC_CAPTURE_MODE=simulated` for demos without a microphone.
- **Persisted flows** use `?reportId=` on `/report` for server-backed share card, share link, challenge registration, and artifact commerce strip.

## Staging deployment checklist

Full tables and commit scope: **[`LAUNCH.md`](./LAUNCH.md)**. Quick pass:

1. **Commit** all untracked BFF/UI paths listed in `LAUNCH.md` (feed, playback, challenge audio, gallery).
2. **API env:** `SESSION_COOKIE_SECRET`, `OPS_CONSOLE_SECRET`, `AUDIO_AUTO_DELETE_AFTER_PROCESSING=false`, `GALLERY_*` as needed; run DB migrations.
3. **Next env:** `FARTS_API_BASE_URL`, optional `OPS_CONSOLE_SECRET` for moderation lab BFF.
4. **Record → report:** Live capture → `/report?reportId=…` + private playback.
5. **Challenge:** Link → counter-record → verdict; challenger/response audio on challenge page.
6. **Feed:** Opt-in → ops approve/publish → `/feed` + report specimen + delist via ops `remove`/`hide`.
7. **Share / premium / analytics:** Share card, share link, premium intent POST, analytics 2xx.
8. **HTTPS** for microphone in non-local staging.

## Intentionally incomplete (not staging blockers for core loop)

- Share-page premium CTA not wired to `recordPremiumIntent` (report action row only).
- Analytics batch ingest (`/api/v1/analytics/events/batch`) has no BFF route.
- Safari / non-WebM live recording not supported beyond capability guards.
- Artifact commerce checkout remains stub/lab-oriented where not part of the table above.

## Design notes

Premium clinical parody: dark default, teal/brass accents, Fraunces + Inter + JetBrains Mono. See `src/app/globals.css` for tokens.
