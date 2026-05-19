import { NextRequest, NextResponse } from 'next/server';
import { smartqr } from '@/lib/smartqr';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await smartqr(`/api/v1/public/qr/${encodeURIComponent(params.id)}`);
  return NextResponse.json(result.data, { status: result.status });
}
