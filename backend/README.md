# Farts.com Backend

Modular monolith API for the AI Fart Report product.

**Phase 1:** health checks, anonymous sessions, fake report generation, PostgreSQL persistence.

**Phase 2:** share-card artifact generation, local storage, artifact analytics.

**Phase 3:** audio upload pipeline, report creation from recorded audio, privacy-oriented lifecycle.

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

## Tests

```bash
# Unit tests (no database)
npm test

# E2E (requires Postgres)
docker compose up -d postgres
npm run test:e2e
```

## Module layout

Each bounded context follows clean architecture layers:

- `domain/` — pure business rules and types
- `application/` — use cases and repository ports
- `infrastructure/` — TypeORM, adapters, renderers
- `interface/http/` — controllers and DTOs

Shared cross-cutting ports (queue, storage, AI, clock, IDs) live under `src/shared/`.
