import { NextRequest, NextResponse } from 'next/server';
import { smartqr } from '@/lib/smartqr';

// Proxy for GET /api/v1/public/qr/{id}/feedback-responses
// Passes through every query param the public endpoint accepts so the
// frontend can build the URL however it likes.
export async function GET(
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

  try {
    const url = new URL(req.url);
    const searchParams: Record<string, string | undefined> = {
      from:     url.searchParams.get('from')     ?? undefined,
      to:       url.searchParams.get('to')       ?? undefined,
      minStars: url.searchParams.get('minStars') ?? undefined,
      maxStars: url.searchParams.get('maxStars') ?? undefined,
      limit:    url.searchParams.get('limit')    ?? undefined,
      offset:   url.searchParams.get('offset')   ?? undefined,
    };

    const result = await smartqr(`/api/v1/public/qr/${encodeURIComponent(id)}/feedback-responses`, {
      method: 'GET',
      searchParams,
    });
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/qr/[id]/feedback-responses] handler error:', err);
    return NextResponse.json(
      { status: 'error', code: 'PROXY_HANDLER_ERROR', message },
      { status: 500 },
    );
  }
}
