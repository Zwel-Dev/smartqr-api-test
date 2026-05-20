import { NextRequest, NextResponse } from 'next/server';
import { smartqr } from '@/lib/smartqr';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await smartqr('/api/v1/public/qr/website:batch', {
      method: 'POST',
      body,
      idempotent: true,
    });
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/qr/website/batch] handler error:', err);
    return NextResponse.json(
      { status: 'error', code: 'PROXY_HANDLER_ERROR', message },
      { status: 500 },
    );
  }
}
