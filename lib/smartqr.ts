import { randomUUID } from 'node:crypto';

interface SmartQrRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  idempotent?: boolean;
  searchParams?: Record<string, string | undefined>;
}

export interface SmartQrResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  correlationId: string | null;
}

/**
 * Thin typed wrapper around fetch for the Smart_QR public API.
 *
 * Reads env vars at CALL time (not module load) so that a misconfiguration
 * surfaces as a clean 502 from the route handler — not an opaque module
 * crash during dev-server startup that's hard to diagnose.
 *
 * All errors (missing env, network failure, timeout) are converted into a
 * structured SmartQrResponse so the route handler can return the integrator
 * a sensible JSON body rather than a 500.
 */
export async function smartqr<T = unknown>(
  path: string,
  opts: SmartQrRequestOptions = {}
): Promise<SmartQrResponse<T>> {
  const BASE_URL = process.env.SMARTQR_BASE_URL;
  const API_KEY  = process.env.SMARTQR_API_KEY;

  if (!BASE_URL || !API_KEY) {
    return {
      ok: false,
      status: 500,
      data: {
        status: 'error',
        code: 'CONFIG_MISSING',
        message:
          'SMARTQR_BASE_URL or SMARTQR_API_KEY is not set on the server. ' +
          'Check .env.local and restart `npm run dev`.',
      } as unknown as T,
      correlationId: null,
    };
  }

  let url: URL;
  try {
    url = new URL(path, BASE_URL);
  } catch {
    return {
      ok: false,
      status: 500,
      data: {
        status: 'error',
        code: 'CONFIG_INVALID_BASE_URL',
        message: `SMARTQR_BASE_URL is not a valid URL: "${BASE_URL}"`,
      } as unknown as T,
      correlationId: null,
    };
  }
  for (const [k, v] of Object.entries(opts.searchParams || {})) {
    if (v != null) url.searchParams.set(k, v);
  }

  const headers: Record<string, string> = {
    'Authorization': `ApiKey ${API_KEY}`,
    'Content-Type': 'application/json',
  };
  if (opts.idempotent) {
    headers['Idempotency-Key'] = randomUUID();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });
    const text = await res.text();
    let data: T;
    try { data = text ? JSON.parse(text) : ({} as T); }
    catch { data = text as unknown as T; }

    return {
      ok: res.ok,
      status: res.status,
      data,
      correlationId: res.headers.get('x-correlation-id'),
    };
  } catch (err: unknown) {
    // Network error (ECONNREFUSED, DNS miss, cert error, timeout, …)
    const aborted = (err as { name?: string })?.name === 'AbortError';
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 502,
      data: {
        status: 'error',
        code: aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNREACHABLE',
        message:
          `Could not reach Smart_QR at ${BASE_URL}. ` +
          (aborted
            ? 'The request timed out after 30 seconds.'
            : `Underlying error: ${message}`) +
          ' Verify the API is running and SMARTQR_BASE_URL is correct.',
      } as unknown as T,
      correlationId: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
