import crypto from 'node:crypto';

export function verifySmartQrSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): { ok: boolean; reason?: string } {
  if (!signatureHeader) return { ok: false, reason: 'missing signature header' };

  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => p.split('=', 2)) as [string, string][]
  );
  const t = parseInt(parts.t, 10);
  const v1 = parts.v1;
  if (!t || !v1) return { ok: false, reason: 'malformed signature header' };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - t) > toleranceSeconds) {
    return { ok: false, reason: 'stale timestamp (replay protection)' };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature mismatch' };
  }
  return { ok: true };
}
