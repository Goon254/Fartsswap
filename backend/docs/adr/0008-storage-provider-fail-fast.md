# 0008 — Storage provider abstraction with fail-fast bootstrap

- Status: Accepted
- Date: 2026-05-17

## Context

Object storage has two backends: local filesystem (dev + early
single-instance prod) and S3 (production at scale). An earlier stub
"S3 adapter" silently returned fake objects when selected without
credentials — a footgun that would corrupt artifacts and break audio
retrieval.

## Decision

- All adapters implement `ObjectStoragePort` (put / get / delete / sign).
- Local adapter normalises every key through `resolveStorageKey`, which
  blocks `..`, absolute paths, null bytes, Windows drive letters, and
  protocol-style keys.
- Real S3 adapter is implemented using `@aws-sdk/client-s3` v3 +
  `@aws-sdk/s3-request-presigner`, with optional `STORAGE_ENDPOINT` to
  point at MinIO/R2/Wasabi/DO Spaces. Auth resolves via explicit
  `STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY` or the AWS SDK default chain
  (IAM, IRSA, env, shared config).
- Env schema rejects boot when `STORAGE_PROVIDER=s3` without `STORAGE_BUCKET`
  + `STORAGE_REGION`. The legacy `UnconfiguredS3ObjectStorageAdapter`
  remains as a guard that throws if anything ever instantiates it.

## Consequences

**Wins**
- No silent failure mode. Either we have a real adapter, or we refuse to
  boot.
- Local and S3 share the same traversal guard, so a single bug fix covers
  both.

**Costs**
- AWS SDK adds ~6 MB to the install. Acceptable for a production backend;
  no native compilation.

## Revisit when

- We need streaming uploads (multipart S3) for files >100 MB.
