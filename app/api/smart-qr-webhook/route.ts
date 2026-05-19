import { NextRequest, NextResponse } from 'next/server';
import { verifySmartQrSignature } from '@/lib/verify-webhook';

const SECRET = process.env.SMARTQR_WEBHOOK_SECRET!;

const seenEventIds = new Set<string>();

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-smart_qr-signature') ?? '';

  const check = verifySmartQrSignature(rawBody, signatureHeader, SECRET);
  if (!check.ok) {
    console.warn('Webhook rejected:', check.reason);
    return new NextResponse(check.reason, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (seenEventIds.has(event.id)) {
    console.log('Duplicate event ignored:', event.id);
    return NextResponse.json({ status: 'ok', duplicate: true });
  }
  seenEventIds.add(event.id);

  switch (event.type) {
    case 'qr.created':
      console.log('QR created:', event.data.qrCodeID, event.data.name);
      break;
    case 'qr.scanned':
      console.log('QR scanned:', event.data.qrCodeID,
                  'from', event.data.country, event.data.city);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }

  return NextResponse.json({ status: 'ok' });
}
