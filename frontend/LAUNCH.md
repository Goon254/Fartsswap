# Staging / launch readiness

Concise operator guide for the integrated product loop (record → report → challenge → feed). Not a product spec.

## 1. Commit / deploy scope

These paths are **critical but were untracked** at last audit — include them in the release commit:

**Frontend (BFF + UI)**

- `src/app/feed/`
- `src/app/api/reports/[reportId]/audio/`
- `src/app/api/gallery/feed/[submissionId]/audio/`
- `src/app/api/challenges/[challengeId]/challenger-audio/`
- `src/app/api/challenges/[challengeId]/response-audio/`
- `src/components/SpecimenPlayback.tsx`
- `src/components/GalleryFeedSubmit.tsx`
- `src/components/FeedCard.tsx`, `FeedPageClient.tsx`, `FeedSpecimenReport.tsx`
- `src/components/ChallengeStatusBlock.tsx`, `ChallengeVerdictPanel.tsx`, `ChallengeSpecimenAudio.tsx`
- `src/lib/gallery-api.ts`, `gallery-report-reasons.ts`, `challenge-reentry.ts`, `challenge-verdict.ts`

**Backend**

- `src/database/migrations/1738200000000-ChallengeResponseReport.ts`
- Challenge audio/detail use cases + gallery specimen label (see `git status` for full list)

Run migrations on the API before or during deploy (`npm run migration:run:prod` or boot-time migrations per `backend/README.md`).

## 2. Environment — Nest API (`backend/.env`)

| Variable | Staging value | Why |
| --- | --- | --- |
| `SESSION_COOKIE_SECRET` | **Required** (≥32 chars) | Signs anonymous session cookies |
| `OPS_CONSOLE_SECRET` | **Required** (≥16 chars) | Protects `/api/v1/ops/*` (moderation queue) |
| `AUDIO_AUTO_DELETE_AFTER_PROCESSING` | **`false`** | Raw audio must remain for private replay + public feed audio |
| `GALLERY_SUBMISSIONS_ENABLED` | `true` | Opt-in from `/report` |
| `GALLERY_PUBLIC_FEED_ENABLED` | `true` | `/feed` bulletin + public audio |
| `AI_ENABLED` | `true` + keys if using live AI | Optional; fallback works without |
| `CORS_ALLOWED_ORIGINS` | Your Next.js origin | Browser only hits Next; still set if anything calls API directly |
| `STORAGE_*` / S3 | Configured | Uploads + playback + feed audio |

Defaults: `GALLERY_PUBLIC_FEED_ENABLED` is **`false`** in code — feed shows “offline” until explicitly enabled.

## 3. Environment — Next.js (`frontend/.env`)

| Variable | Staging value | Why |
| --- | --- | --- |
| `FARTS_API_BASE_URL` | Reachable API origin | **Required** — BFF proxies all integrated routes |
| `NEXT_PUBLIC_LAUNCH_MODE` | `false` | Live homepage (not waitlist shell) |
| `OPS_CONSOLE_SECRET` | Same as API | **Required** for staff sign-in at `/ops/login` (moderation lab, `/ops`, other internal labs) |
| `NEXT_PUBLIC_CAPTURE_MODE` | unset (live) | Set `simulated` only for mic-less demos |

Do **not** point the browser at the API host for integrated flows — use one Next origin so session cookies work.

## 4. Browser / runtime caveats

- **HTTPS** (or `localhost`) required for `getUserMedia` / live recording.
- **Chrome/Chromium** recommended for WebM `MediaRecorder`.
- **Cookies:** First API-touching action sets `farts_session`; subsequent BFF calls must be same-site.
- **Feed moderation:** User opt-in → ops `approve` → `publish` at `/moderation-lab`. Community **Report specimen** on `/feed` sets status `reported`; ops `remove` or `hide` to delist.

## 5. Manual smoke tests (in order)

1. **Home** — Hero shows record vs demo; trust line visible.
2. **Record** — `/analyze?path=record` → capture → `/report?reportId=…` with dossier fields.
3. **Private playback** — “Hear your specimen” plays on report (requires `AUDIO_AUTO_DELETE_AFTER_PROCESSING=false`).
4. **Demo** — `/analyze?path=fake` → variant report without playback block.
5. **Challenge** — From report, send challenge link; recipient records counter-fart; verdict on same URL.
6. **Feed opt-in** — From audio report, “Post to public feed” → pending status.
7. **Ops publish** — Sign in at `/ops/login` (staff password = `OPS_CONSOLE_SECRET`), then `/moderation-lab` → Approve.
8. **Public feed** — `/feed` lists specimen; audio plays; **Report specimen** submits (anonymous session).
9. **Share / premium** — Share card + copy link work; premium intent POST non-blocking on failure.
10. **Analytics** — `POST /api/analytics/events` returns 2xx in network tab.

## 6. Known non-blocking gaps (defer)

- Reported items stay on bulletin until ops `remove`/`hide` (no auto-hide).
- Safari / non-WebM live recording unsupported.
- Share-page premium CTA not wired to intent API.
- Analytics batch endpoint has no BFF route.
- Strategy doc at repo root still describes pre-launch positioning (not runtime ops).
