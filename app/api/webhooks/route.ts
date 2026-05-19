import { NextRequest, NextResponse } from 'next/server';
import { smartqr } from '@/lib/smartqr';

export async function GET() {
  const result = await smartqr('/api/v1/public/webhooks');
  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await smartqr('/api/v1/public/webhooks', { method: 'POST', body });
  return NextResponse.json(result.data, { status: result.status });
}
