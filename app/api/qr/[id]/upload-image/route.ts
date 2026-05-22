import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

// Multipart proxy for POST /api/v1/public/qr/{id}/upload-image?slot=N.
// Hand-rolled (not via the shared smartqr() wrapper) because that wrapper
// serialises JSON bodies — here we forward the original multipart payload
// as-is so the upstream's IFormFile binding sees the same file.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { status: 'error', code: 'VALIDATION_MISSING_FIELD', message: 'QR Code ID is required.' },
      { status: 400 },
    );
  }

  const BASE_URL = process.env.SMARTQR_BASE_URL;
  const API_KEY  = process.env.SMARTQR_API_KEY;
  if (!BASE_URL || !API_KEY) {
    return NextResponse.json(
      {
        status: 'error',
        code: 'CONFIG_MISSING',
        message:
          'SMARTQR_BASE_URL or SMARTQR_API_KEY is not set on the server. ' +
          'Check .env.local and restart `npm run dev`.',
      },
      { status: 500 },
    );
  }

  try {
    // Read the multipart body and rebuild a FormData so the server sees a
    // fresh boundary. (Streaming the raw body works too, but FormData round-
    // trips cleanly across runtimes.)
    const incoming = await req.formData();
    const file = incoming.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { status: 'error', code: 'VALIDATION_MISSING_FIELD', message: 'file field is required.' },
        { status: 400 },
      );
    }

    const outgoing = new FormData();
    outgoing.append('file', file, file.name || 'upload.bin');

    const upstreamUrl = new URL(`/api/v1/public/qr/${encodeURIComponent(id)}/upload-image`, BASE_URL);

    const upstream = await fetch(upstreamUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization':   `ApiKey ${API_KEY}`,
        'Idempotency-Key': randomUUID(),
        // NB: do NOT set Content-Type — fetch sets it (with boundary) for FormData.
      },
      body: outgoing,
      cache: 'no-store',
    });

    const text = await upstream.text();
    let body: unknown;
    try { body = text ? JSON.parse(text) : {}; }
    catch { body = text; }
    return NextResponse.json(body, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/qr/[id]/upload-image] handler error:', err);
    return NextResponse.json(
      { status: 'error', code: 'PROXY_HANDLER_ERROR', message },
      { status: 500 },
    );
  }
}
