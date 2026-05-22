'use client';

import { useRef, useState } from 'react';

// ====================================================================
// Customer Support Hub — Image upload tester (standalone)
//
// Demonstrates the multipart POST endpoint. The integrator types a QR
// Code ID, chooses a JPEG/PNG/WEBP under 5 MB, and submits. The
// response is the public URL the server stored — exactly what the QR's
// serviceImage field value now holds.
//
// Not linked from the sidebar by default — the single-create page is
// the primary path. Kept around for direct "fix the image on an
// existing QR" usage.
// ====================================================================

interface UploadResult {
  status?: string;
  qrCodeID?: string;
  imageUrl?: string;
  code?: string;
  message?: string;
  field?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export default function UploadPage() {
  const [qrCodeId, setQrCodeId] = useState('');
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<UploadResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ALLOWED_MIMES.includes(f.type)) {
      setError(`Unsupported file type "${f.type || 'unknown'}". Use JPEG, PNG, or WEBP.`);
      setFile(null);
      setPreview(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`File too large: ${(f.size / 1024 / 1024).toFixed(2)} MB. Max 5 MB.`);
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!qrCodeId.trim() || !file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append('file', file);

    const url = `/api/qr/${encodeURIComponent(qrCodeId.trim())}/upload-image`;

    try {
      const res = await fetch(url, { method: 'POST', body: form });
      const body = (await res.json()) as UploadResult;
      if (!res.ok) {
        setError(body.message || `HTTP ${res.status}`);
      }
      setResult(body);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQrCodeId('');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <main className="max-w-3xl mx-auto p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Support Hub — Image upload</h1>
        <p className="text-gray-500 text-sm mt-1">
          POST <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/public/qr/&#123;id&#125;/upload-image</code> —
          multipart/form-data. JPEG, PNG, or WEBP, up to 5 MB. Replaces the QR&apos;s existing hero image.
        </p>
      </header>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <section className="p-5 space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-gray-700 mb-1">QR Code ID *</span>
            <input value={qrCodeId} onChange={e => setQrCodeId(e.target.value)} required
                   className={inputClass} placeholder="QR_01HKZ..." />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-700 mb-1">
              Image file <span className="text-gray-400 font-normal ml-2">JPEG / PNG / WEBP · ≤ 5 MB</span>
            </span>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                   onChange={onFileChange}
                   className="block w-full text-sm text-gray-700
                              file:mr-3 file:px-4 file:py-2 file:rounded-md
                              file:border-0 file:bg-blue-50 file:text-blue-700
                              file:font-medium hover:file:bg-blue-100" />
          </label>

          {preview && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview"
                   className="max-w-[260px] max-h-[260px] rounded shadow-sm" />
              <div className="mt-2 text-[11px] text-gray-500">
                {file?.name} · {file ? (file.size / 1024).toFixed(1) : 0} KB · {file?.type}
              </div>
            </div>
          )}
        </section>

        <div className="p-5 flex items-center justify-end gap-2 bg-gray-50 border-t border-gray-100">
          <button type="button" onClick={reset} disabled={loading}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700
                             bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium">
            Reset
          </button>
          <button type="submit" disabled={loading || !qrCodeId.trim() || !file}
                  className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                             disabled:opacity-50 disabled:cursor-not-allowed
                             text-white text-sm font-medium">
            {loading ? 'Uploading…' : 'Upload hero image'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <section className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-3">Result</h2>
          {result.imageUrl ? (
            <div className="space-y-3">
              <div className="text-xs space-y-1.5">
                <Row label="Status"  value={result.status} />
                <Row label="QR ID"   value={result.qrCodeID} mono />
                <Row label="Field"   value="serviceImage" />
                <Row label="URL" value={
                  <a href={result.imageUrl} target="_blank" rel="noreferrer"
                     className="text-blue-600 hover:underline break-all">
                    {result.imageUrl}
                  </a>
                } />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.imageUrl} alt="Uploaded"
                   className="mt-2 max-w-[320px] rounded border border-gray-200" />
            </div>
          ) : (
            <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </section>
      )}
    </main>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm ' +
  'focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ' +
  'placeholder:text-gray-400';

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide w-16 flex-shrink-0">
        {label}
      </span>
      <span className={`flex-1 min-w-0 ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</span>
    </div>
  );
}
