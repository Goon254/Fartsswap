import { BadRequestException } from '@nestjs/common';
import { resolve, sep, normalize } from 'path';

/**
 * Resolve a storage key under the given base directory while guaranteeing it
 * cannot escape via `..`, absolute paths, or null bytes.
 *
 * Throws BadRequestException for any traversal/abuse attempt so callers can
 * return a clean 400 to the client without leaking filesystem details.
 */
export function resolveStorageKey(basePath: string, key: string): string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BadRequestException('Storage key is required');
  }
  if (key.includes('\0')) {
    throw new BadRequestException('Invalid storage key');
  }

  // Reject protocol-style keys before normalization so `path.normalize` doesn't
  // collapse `http://` to `http:/` and slip past the check.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(key)) {
    throw new BadRequestException('Invalid storage key');
  }

  // Reject absolute paths and Windows drive letters.
  const normalizedKey = normalize(key).replace(/\\/g, '/');
  if (
    normalizedKey.startsWith('/') ||
    normalizedKey.startsWith('\\') ||
    /^[a-zA-Z]:[/\\]/.test(normalizedKey)
  ) {
    throw new BadRequestException('Invalid storage key');
  }
  if (normalizedKey === '..' || normalizedKey.startsWith('../') || normalizedKey.includes('/../')) {
    throw new BadRequestException('Invalid storage key');
  }

  const resolvedBase = resolve(basePath);
  const resolved = resolve(resolvedBase, normalizedKey);

  const baseWithSep = resolvedBase.endsWith(sep) ? resolvedBase : resolvedBase + sep;
  if (resolved !== resolvedBase && !resolved.startsWith(baseWithSep)) {
    throw new BadRequestException('Invalid storage key');
  }

  return resolved;
}
