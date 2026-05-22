import { NextRequest, NextResponse } from 'next/server';
import { smartqr } from '@/lib/smartqr';

// Proxy for GET /api/v1/public/qr/{id}/feedback-analytics
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
    const result = await smartqr(`/api/v1/public/qr/${encodeURIComponent(id)}/feedback-analytics`, {
      method: 'GET',
      searchParams: {
        from: url.searchParams.get('from') ?? undefined,
        to:   url.searchParams.get('to')   ?? undefined,
      },
    });
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/qr/[id]/feedback-analytics] handler error:', err);
    return NextResponse.json(
      { status: 'error', code: 'PROXY_HANDLER_ERROR', message },
      { status: 500 },
    );
  }
}
