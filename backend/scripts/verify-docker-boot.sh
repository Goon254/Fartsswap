#!/usr/bin/env bash
# Verify the production Docker image actually:
#   1. Builds without copying src/
#   2. Includes compiled migrations under dist/database/migrations
#   3. Runs migrations against a fresh Postgres
#   4. Boots and responds 200 on /ready
#
# Requires: docker (with buildx) + a free port 5499 and 3399 locally.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="farts-backend:verify-$(date +%s)"
NET="farts-verify-$$"
PG_NAME="farts-pg-verify-$$"
API_NAME="farts-api-verify-$$"

cleanup() {
  set +e
  docker rm -f "$API_NAME" >/dev/null 2>&1 || true
  docker rm -f "$PG_NAME" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cd "$ROOT_DIR"

echo "[1/5] Building production image: $IMAGE_TAG"
docker build -t "$IMAGE_TAG" .

echo "[2/5] Asserting compiled migrations are baked into the image..."
docker run --rm --entrypoint sh "$IMAGE_TAG" -c \
  'ls dist/database/migrations/*.js >/dev/null && echo OK'

echo "[3/5] Starting ephemeral Postgres..."
docker network create "$NET" >/dev/null
docker run -d --name "$PG_NAME" --network "$NET" \
  -e POSTGRES_USER=farts -e POSTGRES_PASSWORD=farts -e POSTGRES_DB=farts \
  -p 5499:5432 postgres:16-alpine >/dev/null

echo "    waiting for postgres..."
for i in {1..30}; do
  if docker exec "$PG_NAME" pg_isready -U farts -d farts >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[4/5] Running migrations from compiled JS..."
docker run --rm --network "$NET" \
  -e DATABASE_HOST="$PG_NAME" -e DATABASE_USER=farts -e DATABASE_PASSWORD=farts \
  -e DATABASE_NAME=farts -e DATABASE_PORT=5432 \
  -e SESSION_COOKIE_SECRET=test-secret-test-secret-test-secret-1234 \
  --entrypoint node "$IMAGE_TAG" dist/database/run-migrations.js

echo "[5/5] Booting API and probing /ready..."
docker run -d --name "$API_NAME" --network "$NET" -p 3399:3000 \
  -e NODE_ENV=production \
  -e DATABASE_HOST="$PG_NAME" -e DATABASE_USER=farts -e DATABASE_PASSWORD=farts \
  -e DATABASE_NAME=farts -e DATABASE_PORT=5432 \
  -e DATABASE_RUN_MIGRATIONS=false \
  -e SESSION_COOKIE_SECRET=test-secret-test-secret-test-secret-1234 \
  -e QUEUE_PROVIDER=memory -e STORAGE_PROVIDER=local \
  -e CORS_ALLOWED_ORIGINS=http://localhost:3000 \
  "$IMAGE_TAG" >/dev/null

ok=false
for i in {1..30}; do
  if curl -sf http://localhost:3399/ready >/dev/null; then
    ok=true
    break
  fi
  sleep 1
done

if ! $ok; then
  echo "    /ready did not become healthy. Container logs:"
  docker logs "$API_NAME" || true
  exit 1
fi

echo "OK: production image boots, migrations apply, /ready returns 200."
