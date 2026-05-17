# syntax=docker/dockerfile:1.7

# --- builder stage ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && \
    # Sanity check: compiled migrations + worker entrypoint must be in the runtime image.
    test -d dist/database/migrations && \
    ls dist/database/migrations/*.js >/dev/null 2>&1 && \
    test -f dist/main.js && \
    test -f dist/worker.js

# --- runner stage ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install only production deps.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JS only.
COPY --from=builder /app/dist ./dist

# Default storage path; mount a volume here in production for the local adapter.
RUN mkdir -p /app/.storage && \
    addgroup -S app && adduser -S app -G app && \
    chown -R app:app /app
USER app

EXPOSE 3000

# Default entrypoint = API. To run the worker process:
#   CMD ["node", "dist/worker.js"]
# Or override at deploy time by setting CMD/entrypoint in your orchestrator.
#
# Boot-time migrations run automatically when DATABASE_RUN_MIGRATIONS=true (default).
# Alternative for K8s initContainer:
#   node dist/database/run-migrations.js
CMD ["node", "dist/main.js"]
