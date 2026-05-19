import { NextRequest, NextResponse } from 'next/server';
import { smartqr } from '@/lib/smartqr';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const result = await smartqr(`/api/v1/public/qr/${encodeURIComponent(params.id)}/analytics`, {
    searchParams: {
      from: searchParams.get('from') ?? undefined,
      to:   searchParams.get('to')   ?? undefined,
    },
  });
  return NextResponse.json(result.data, { status: result.status });
}
