# Farts.com Backend

Modular monolith API for the AI Fart Report product.

**Phase 1:** health checks, anonymous sessions, fake report generation, PostgreSQL persistence.

**Phase 2:** share-card artifact generation, local storage, artifact analytics.

**Phase 3:** audio upload pipeline, report creation from recorded audio, privacy-oriented lifecycle.

**Phase 4 (hardening):** signed session cookies, helmet/CORS/rate-limit, server-side audio
magic-byte sniffing, path-traversal-safe storage, fail-fast S3, DB transaction boundaries,
Idempotency-Key support on critical POSTs, optional audio auto-delete after processing,
real Postgres/Redis/storage readiness checks, Docker boot verification.

**Phase 5 (operational excellence):** real AWS-SDK S3 adapter, Redis-backed rate limit +
idempotency cache, Prometheus `/metrics` (HTTP + business counters), OpenTelemetry
tracing (env-gated), Sentry-style error reporting, graceful shutdown + signal handling,
outbox table + dispatcher for at-least-once analytics, separate `worker` process,
audio retention sweeper, strict TypeScript + strict typed ESLint, CI with audit +
Trivy image scan + CycloneDX SBOM, ADR folder.

**Phase 6 (AI report orchestrator):** real AI-authored report fields for both fake and
audio flows behind an env-gated provider (`AI_PROVIDER=openai`), structured-JSON output
contract with Zod validation, brand-safety + content-sanitisation pass, server-controlled
`reportHash`, deterministic fallback on every failure (invalid JSON, timeout, provider
error, disallowed content), `ai.report_*` analytics events without prompts or raw
responses.

**Phase 7 (PDF report artifacts + AI usage caps):** programmatic PDF "diagnostic
dossier" via `pdfkit` (no headless browser), theme registry (free `default`
+ premium `clinical_gold` / `courtroom` / `space_agency`), new
`POST /api/v1/reports/:reportId/artifacts/pdf` endpoint with content-level
deduplication per `(reportId, themeCode)`, Redis-backed daily AI usage caps
per session and per IP with in-process fallback, deterministic fallback when a
quota is hit (`reason=quota_exceeded:<scope>`), new Prometheus counters
(`ai_reports_attempted_total`, `ai_reports_quota_exceeded_total`,
`pdf_artifacts_generated_total`, `pdf_artifact_generation_seconds`).

### AI report orchestrator

All report-creation endpoints (`POST /api/v1/reports/fake`, `POST /api/v1/reports/from-audio`)
now route through `AiReportOrchestrator`. The orchestrator:

1. Builds a strict, safety-laden system prompt + a source-shaped user prompt.
2. Calls the configured provider (currently OpenAI-compatible chat completions).
3. Parses + validates the JSON response with Zod.
4. Runs a rule-based content safety + truncation pass.
5. Generates the `reportHash` server-side (the model's suggestion is discarded).
6. On any failure — invalid JSON, timeout, HTTP error, disallowed content — silently
   falls back to the deterministic generator. **User requests never fail because of AI.**

| Env | Purpose | Default |
|---|---|---|
| `AI_PROVIDER` | `openai`, `disabled`, `stub` | `disabled` |
| `AI_ENABLED` | Master kill-switch. Set `true` to enable real AI calls. | `false` |
| `AI_API_KEY` | Bearer token for the provider. | unset |
| `AI_BASE_URL` | OpenAI-compatible endpoint root. | `https://api.openai.com/v1` |
| `AI_MODEL` | Model id passed to the provider. | `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | Per-call deadline. The orchestrator falls back when exceeded. | `8000` |
| `AI_MAX_TOKENS` | Soft cap on completion tokens. | `400` |
| `AI_TEMPERATURE` | Sampling temperature. | `0.9` |
| `AI_MAX_RETRIES` | Bounded retries on transient 5xx / timeouts. | `1` |
| `AI_DEBUG_LOG` | When true, emits structured (no-prompt) debug logs. | `false` |

**To run with AI disabled (default):** leave `AI_ENABLED=false`. The orchestrator routes
every request to the deterministic fallback and emits `ai.report_failed` with
`reason: "provider_not_callable"`. Output quality is identical to pre-AI phases.

**To enable real AI:**
```bash
AI_PROVIDER=openai
AI_ENABLED=true
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```
Reports will now use AI-authored fields for `fartName`, `classification`, `powerScore`,
`emotionalTone`, `probableCause`, `cinematicParallel`, `threatLevel`, `shortSummary`
(plus optional `genre`, `confidenceLabel`, `warningBadge`). The server always controls
`reportHash` and the `durationMs` for audio reports.

**Safety guarantees:**
- Hard refuse-list in the system prompt (sexual, slurs, medical, real-people, graphic,
  self-harm, political).
- Server-side regex sanitiser replaces any disallowed-content field with the deterministic
  fallback, never partially redacts.
- Length caps per field (60–180 chars) enforced after the model returns.
- `threatLevel` normalised to the closed set `{Green, Amber, Red, Cerulean}`.

**Analytics:**
`ai.report_requested`, `ai.report_succeeded`, `ai.report_failed` are emitted via the
outbox. Payloads include `source`, `provider`, `model`, `latencyMs`, `fallbackUsed`,
and (on failure) a `reason` tag. Prompts and raw model output are **never** in analytics
payloads.

## Prerequisites

- Node.js 20+
- Docker (recommended for Postgres + Redis)

## Quick start

```bash
cd backend
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run start:dev
```

- API: http://localhost:3000
- OpenAPI: http://localhost:3000/docs
- Health: http://localhost:3000/health
- Readiness: http://localhost:3000/ready

## Phase 2: share-card artifact flow

### 1. Create a fake report

```bash
curl -X POST http://localhost:3000/api/v1/reports/fake \
  -H 'Content-Type: application/json' \
  -d '{"customFartName":"The Midnight Bean","tonePreset":"clinical"}' \
  -c cookies.txt
```

Save the `id` from the response as `REPORT_ID`.

### 2. Generate a share-card artifact

```bash
curl -X POST "http://localhost:3000/api/v1/reports/${REPORT_ID}/artifacts/share-card" \
  -H 'Content-Type: application/json' \
  -d '{"styleVariant":"clinical"}' \
  -b cookies.txt
```

### 3. List artifacts for the report

```bash
curl "http://localhost:3000/api/v1/reports/${REPORT_ID}/artifacts" -b cookies.txt
```

### 4. Get artifact metadata

```bash
curl "http://localhost:3000/api/v1/artifacts/${ARTIFACT_ID}" -b cookies.txt
```

### 5. Stream artifact HTML content

```bash
curl "http://localhost:3000/api/v1/artifacts/${ARTIFACT_ID}/content" -b cookies.txt
```

## Phase 3: audio record flow

Constraints (configurable via env):

| Setting | Default |
|---------|---------|
| `AUDIO_UPLOAD_MAX_BYTES` | 1,048,576 (1 MB) |
| `AUDIO_UPLOAD_ALLOWED_MIME_TYPES` | `audio/webm`, `audio/ogg`, `audio/mpeg` |
| `AUDIO_UPLOAD_STORAGE_PREFIX` | `audio/raw` |
| Max duration hint | 10 seconds (`durationSeconds` field) |

Raw audio is **never** returned via public URLs. Metadata responses omit `storageKey`.

### 1. Upload audio (multipart)

```bash
curl -X POST http://localhost:3000/api/v1/audio/uploads \
  -F 'file=@clip.webm;type=audio/webm' \
  -F 'durationSeconds=2' \
  -c cookies.txt
```

Save `id` as `AUDIO_UPLOAD_ID`.

### 2. Create report from audio

```bash
curl -X POST http://localhost:3000/api/v1/reports/from-audio \
  -H 'Content-Type: application/json' \
  -d '{"audioUploadId":"'"$AUDIO_UPLOAD_ID"'","customFartName":"Recorded Bean"}' \
  -b cookies.txt
```

Report `source` will be `audio_recording`. Analysis uses the placeholder fake generator until real AI is wired.

### 3. Inspect upload metadata

```bash
curl "http://localhost:3000/api/v1/audio/uploads/${AUDIO_UPLOAD_ID}" -b cookies.txt
```

### 4. Delete upload (before report creation only)

```bash
curl -X DELETE "http://localhost:3000/api/v1/audio/uploads/${AUDIO_UPLOAD_ID}" -b cookies.txt
```

### Local audio storage

```
.storage/audio/raw/{sessionId|anonymous}/{audioUploadId}.webm
```

### Playback and feed audio

Keep `AUDIO_AUTO_DELETE_AFTER_PROCESSING=false` (default in `.env.example`) so raw uploads remain after dossier creation. Required for:

- Session-private `GET /api/v1/reports/:id/audio`
- Public `GET /api/v1/gallery/feed/:submissionId/audio` (published + listed items only)

## Public gallery / feed (opt-in)

| Env | Default | Purpose |
| --- | --- | --- |
| `GALLERY_SUBMISSIONS_ENABLED` | `true` | `POST /api/v1/gallery/submissions` (session-owned reports) |
| `GALLERY_PUBLIC_FEED_ENABLED` | **`false`** | `GET /api/v1/gallery/feed` — when false, returns `{ enabled: false, items: [] }` |

Lifecycle: `submitted_for_review` → ops `approve` → ops `publish` → optional community `POST /api/v1/gallery/reports` → status `reported` → ops `remove` / `hide`.

Ops routes: `/api/v1/ops/gallery/*` with `x-ops-key` (`OPS_CONSOLE_SECRET`). Integrated frontend: `/moderation-lab`.

## Local artifact storage

Generated files are stored under the configured local path (default: `backend/.storage/`):

```
.storage/artifacts/share_card/{reportId}/{artifactId}.html
```

The artifact metadata response includes:

- `storageKey` — path relative to the storage root
- `retrievalUrl` — `file://` URL in local dev
- `contentUrl` — API route to stream HTML

## Full stack with Docker

```bash
cp .env.example .env
docker compose up --build
```

### Production container boot behavior

The production image is a clean multi-stage build:

1. **Builder stage** compiles TypeScript and asserts that
   `dist/database/migrations/*.js` exist before tagging.
2. **Runner stage** copies **only `dist/`** plus production node_modules. No
   `src/` is shipped. The runtime user is non-root (`app:app`).

Migrations:

- **Default:** `node dist/main.js` runs pending migrations on boot when
  `DATABASE_RUN_MIGRATIONS=true` (default).
- **Pre-deploy / K8s initContainer:** disable boot-time migrations
  (`DATABASE_RUN_MIGRATIONS=false`) and run them as a separate step:
  ```bash
  node dist/database/run-migrations.js
  # or: npm run migration:run:prod
  ```
- The TypeORM data source resolves entities/migrations relative to its own
  compiled location (`dist/database/data-source.js`), so paths are correct in
  the production container.

Verify the full production boot path locally (builds image, runs
migrations, hits `/ready`):

```bash
npm run verify:docker-boot
```

### Process roles

The same image can run as an HTTP API, a background worker, or both (default).
Control via `APP_ROLE`:

- `APP_ROLE=api` — Fastify HTTP server only. Use for the public-facing pods.
- `APP_ROLE=worker` — no HTTP. Boots the outbox dispatcher + audio retention
  sweeper only. Use for background pods.
- `APP_ROLE=all` (default) — both. Use for dev or single-instance deploys.

Entrypoints:
```bash
node dist/main.js     # HTTP API
node dist/worker.js   # background worker
```

`docker-compose.yml` ships both an `api` and a `worker` service so you can
exercise the split locally.

### Observability

| Endpoint / signal | Purpose |
|---|---|
| `GET /metrics` | Prometheus scrape. Default Node metrics + custom counters/histograms (`http_*`, `reports_created_total`, `audio_uploads_total`, `artifacts_generated_total`, `idempotency_replay_total`, `outbox_*`, `audio_retention_deleted_total`). Excluded from the public OpenAPI. |
| OpenTelemetry traces | Enabled with `OTEL_ENABLED=true`. Auto-instruments Fastify HTTP, TypeORM/`pg`, ioredis, and outbound HTTP. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to your collector. |
| Sentry-style errors | Set `SENTRY_DSN` to enable. Unhandled rejections, uncaught exceptions, and explicit `captureException` calls from background services flow here. No-op when DSN unset. |

### Security / runtime configuration

| Variable | Purpose | Default |
|---|---|---|
| `SESSION_COOKIE_SECRET` | HMAC secret for signed anonymous session cookies. **Required in production** (≥32 chars). | dev-only fallback |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins, or `*` for dev only. | `*` |
| `RATE_LIMIT_MAX` | Global request budget per `RATE_LIMIT_WINDOW_SECONDS`. Per-route POST limits are tighter (see `@RateLimit` decorators). | `60` |
| `RATE_LIMIT_WINDOW_SECONDS` | Window for the global limiter. | `60` |
| `REQUEST_BODY_LIMIT_BYTES` | JSON body limit. Multipart uploads use `AUDIO_UPLOAD_MAX_BYTES`. | `131072` |
| `IDEMPOTENCY_TTL_SECONDS` | TTL for cached idempotent responses. | `86400` |
| `AUDIO_AUTO_DELETE_AFTER_PROCESSING` | When `true`, raw audio is deleted from object storage immediately after a report is created from it. Status flips to `deleted`, metadata remains. | `false` |
| `STORAGE_PROVIDER` | `local` (filesystem) or `s3` (AWS SDK v3 — works against AWS S3, MinIO, R2, Wasabi, DO Spaces via `STORAGE_ENDPOINT`). Env schema rejects boot for `s3` without `STORAGE_BUCKET` + `STORAGE_REGION`. | `local` |
| `APP_ROLE` | `api`, `worker`, or `all`. Controls which subsystems boot in this process. | `all` |
| `SHUTDOWN_GRACE_SECONDS` | How long to wait for in-flight requests + background ticks on SIGTERM. | `15` |
| `AUDIO_RETENTION_MAX_AGE_HOURS` | Worker sweeper hard-deletes any non-deleted audio older than this. `0` disables. | `24` |
| `OUTBOX_*` | Dispatcher poll interval, batch size, max attempts before dead-letter. | see `.env.example` |
| `ENABLE_SWAGGER` | Force `/docs` on in production. Off by default in production to reduce attack surface. | unset |

### Idempotency

`POST /api/v1/reports/fake`, `POST /api/v1/reports/from-audio`, and
`POST /api/v1/reports/:reportId/artifacts/share-card` accept an optional
`Idempotency-Key` header (UUID-like, 8–128 chars, `[A-Za-z0-9_.:-]`).

- First request executes normally and caches the response.
- Retries with the same key + scope (+ same body) replay the cached response
  and include `Idempotent-Replayed: true`.
- Same key with a different body returns `409 Conflict`.
- Keys are scoped to the originating session cookie so one session can't
  replay another's response.

### Health / readiness

- `GET /health` — liveness only. No dependency checks. Never throttled.
- `GET /ready` — verifies Postgres + storage + Redis (when
  `QUEUE_PROVIDER=redis`). Use this for load-balancer readiness probes.

## Tests

```bash
# Unit tests (no database)
npm test

# E2E (requires Postgres)
docker compose up -d postgres
npm run test:e2e
```

CI runs (see `.github/workflows/backend-ci.yml`):
- `build-and-test`: strict `tsc` typecheck, strict ESLint, build (asserts compiled migrations + worker), unit tests.
- `audit`: `npm audit --omit=dev --audit-level=high`.
- `e2e-tests`: real Postgres service container, runs migrations, executes the e2e suite.
- `image-scan`: builds the production image, scans with Trivy (fails on HIGH/CRITICAL, uploads SARIF to GitHub code scanning), generates a CycloneDX SBOM artifact.

### PDF diagnostic dossier (Phase 7)

`POST /api/v1/reports/:reportId/artifacts/pdf` generates a single-page PDF
dossier for an existing report, using the same session-ownership and rate-limit
rules as the share card.

Body:
```json
{ "themeCode": "clinical_gold" }
```

| themeCode | Tier | Notes |
|---|---|---|
| `default` | free | Standard navy + slate, used when `themeCode` is missing or unrecognised |
| `clinical_gold` | premium* | Gold accents on near-black, faux Bureau seal |
| `courtroom` | premium* | Deep red + parchment, period-piece feel |
| `space_agency` | premium* | Cyan on slate, "national agency briefing" feel |

*Themes are tagged but **not yet entitlement-gated**. Selecting any theme is
free in this phase; payment enforcement will hook into the same field in a
later phase without changing the API.

Behaviour:
- Renders via `pdfkit` programmatically (no browser dependency).
- Stores the resulting PDF under `artifacts/report_pdf/<reportId>/<artifactId>.pdf`.
- Returns the artifact DTO with `type: report_pdf`, `themeCode`, `mimeType:
  application/pdf`, and a `contentUrl` pointing at `/api/v1/artifacts/:id/content`.
- Content-level dedup: repeat calls for the same `(reportId, themeCode)`
  return the existing READY artifact without re-rendering. Combined with the
  controller-level `@Idempotent` decorator this gives two layers of dedup
  (header-keyed for retries + content-keyed for repeats).
- Unknown `themeCode` values are coerced to `default` — the endpoint does not
  400 on theme alone.

Analytics events: `pdf.artifact_requested`, `pdf.artifact_generated`,
`pdf.artifact_failed` (via outbox).

Metrics: `pdf_artifacts_generated_total{themeCode,outcome}` +
`pdf_artifact_generation_seconds{themeCode}`.

### AI usage caps (Phase 7)

Both report flows now consume from a daily AI usage quota before reaching the
provider. Counters are Redis-backed (`ai:quota:<scope>:<id>:<YYYY-MM-DD>`,
TTL'd to end-of-day UTC) with a per-process in-memory fallback when Redis is
unavailable.

| Env | Default | Effect |
|---|---|---|
| `AI_DAILY_SESSION_LIMIT` | `50` | Max AI report attempts per anonymous session per UTC day. `0` disables the session cap. |
| `AI_DAILY_IP_LIMIT` | `200` | Max attempts per client IP per UTC day. `0` disables the IP cap. |

**Every attempt counts**, including deterministic fallbacks, so a flood of bad
input can't burn the budget. When either cap is exceeded:
- The provider is **not** called.
- The deterministic fallback fields are returned with HTTP 200.
- `AiReportResult.meta.fallbackReason` is `quota_exceeded:session` or
  `quota_exceeded:ip`.
- The `ai.report_failed` analytics event carries the same `reason`.
- The Prometheus counter `ai_reports_quota_exceeded_total{scope}` is
  incremented.

API contracts and HTTP status codes are unchanged — clients only see a flag in
the analytics layer; the user experience degrades gracefully.

Client IPs and session IDs are NEVER placed in metric labels (high cardinality,
PII). They appear only in the (private) Redis keys and in opaque inputs to the
quota adapter.

### Architectural Decision Records

See `docs/adr/` for the dated rationale behind major decisions
(modular monolith, ports + adapters, ALS-based transactions, outbox,
observability stack, idempotency, signed cookies, storage fail-fast).

## Module layout

Each bounded context follows clean architecture layers:

- `domain/` — pure business rules and types
- `application/` — use cases and repository ports
- `infrastructure/` — TypeORM, adapters, renderers
- `interface/http/` — controllers and DTOs

Shared cross-cutting ports (queue, storage, AI, clock, IDs, transactions)
live under `src/shared/`.
