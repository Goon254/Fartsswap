import { NextResponse } from 'next/server';

/** Response headers copied from upstream → browser (hop-by-hop excluded). */
const PROXIED_RESPONSE_HEADER_ALLOWLIST = new Set([
  'cache-control',
  'content-type',
  'content-length',
  'content-disposition',
  'etag',
  'last-modified',
  'vary',
]);

export type ResolveUpstreamBaseResult =
  | { ok: true; baseUrl: string }
  | { ok: false; response: NextResponse };

/**
 * Resolves the backend origin for BFF proxies.
 * In production/staging, `FARTS_API_BASE_URL` must be set. In development, missing
 * values fall back to `http://127.0.0.1:3000`.
 *
 * Callers must forward the browser `Cookie` header on requests and pass through
 * upstream `Set-Cookie` on responses (see `buildForwardedRequestHeaders`,
 * `toProxiedNextResponse`) so anonymous API sessions work from the Next origin only.
 */
export function resolveUpstreamBaseUrl(): ResolveUpstreamBaseResult {
  const raw = process.env.FARTS_API_BASE_URL?.trim();
  if (raw) {
    try {
      // Throws on invalid URL
      const u = new URL(raw);
      if (!/^https?:$/i.test(u.protocol)) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: 'FARTS_API_BASE_URL must be an http(s) URL' },
            { status: 500 },
          ),
        };
      }
      return { ok: true, baseUrl: raw.replace(/\/+$/, '') };
    } catch {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'FARTS_API_BASE_URL is not a valid URL' },
          { status: 500 },
        ),
      };
    }
  }
  if (process.env.NODE_ENV === 'production') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'FARTS_API_BASE_URL is not configured' },
        { status: 503 },
      ),
    };
  }
  return { ok: true, baseUrl: 'http://127.0.0.1:3000' };
}

/**
 * Builds the upstream URL: `{baseUrl}{upstreamPath}{search from requestUrl}`.
 * `upstreamPath` must start with `/` (e.g. `/api/v1/reports/...`).
 */
export function buildUpstreamRequestUrl(
  baseUrl: string,
  upstreamPath: string,
  requestUrl: string,
): string {
  const path = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`;
  const u = new URL(requestUrl);
  return `${baseUrl.replace(/\/+$/, '')}${path}${u.search}`;
}

/** Lowercase names of request headers to forward to the backend. */
export function buildForwardedRequestHeaders(
  request: Request,
  headerNames: readonly string[],
): Headers {
  const out = new Headers();
  for (const name of headerNames) {
    const value = request.headers.get(name);
    if (value) out.set(name, value);
  }
  return out;
}

/** Appends each `Set-Cookie` from the upstream `fetch` response onto the Next response. */
export function forwardUpstreamSetCookieHeaders(upstream: Response, onto: NextResponse): void {
  const anyHeaders = upstream.headers as Headers & { getSetCookie?: () => string[] };
  const multi = typeof anyHeaders.getSetCookie === 'function' ? anyHeaders.getSetCookie() : [];
  if (multi.length > 0) {
    for (const cookie of multi) {
      onto.headers.append('set-cookie', cookie);
    }
    return;
  }
  const single = upstream.headers.get('set-cookie');
  if (single) {
    onto.headers.append('set-cookie', single);
  }
}

/** Copies allowlisted safe headers from upstream onto the outgoing Next response. */
export function copyAllowlistedUpstreamResponseHeaders(
  upstream: Response,
  onto: NextResponse,
): void {
  for (const name of PROXIED_RESPONSE_HEADER_ALLOWLIST) {
    const value = upstream.headers.get(name);
    if (value) onto.headers.set(name, value);
  }
  forwardUpstreamSetCookieHeaders(upstream, onto);
}

/**
 * Returns a NextResponse that preserves status, body stream or buffer, content type,
 * cache directives, and all `Set-Cookie` headers from the upstream response.
 */
export function toProxiedNextResponse(upstream: Response): NextResponse {
  const body = upstream.body;
  const res =
    body !== null
      ? new NextResponse(body, { status: upstream.status, statusText: upstream.statusText })
      : new NextResponse(null, { status: upstream.status, statusText: upstream.statusText });
  copyAllowlistedUpstreamResponseHeaders(upstream, res);
  return res;
}

export function upstreamFetchErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Upstream fetch failed';
  return NextResponse.json({ error: message }, { status: 502 });
}

/**
 * Undici requires `duplex: 'half'` when `body` is a ReadableStream.
 * Not yet in the DOM `RequestInit` typedef; cast at the `fetch` callsite merge.
 */
export const STREAMING_REQUEST_BODY_INIT = { duplex: 'half' } as unknown as RequestInit;
