'use client';

import { useState, type ReactNode } from 'react';
import {
  RequestPanel, ResponsePanel,
  type RequestLog, type ResponseLog,
} from '@/app/components/io-panels';

// ====================================================================
// Customer Support Hub — Single create (with inline image upload)
//
// Each image slot offers either a URL field OR a file picker. On submit
// the page runs a two-phase chain: (1) create the QR, (2) upload any
// picked files into their corresponding slot. The response panel shows
// step-by-step progress.
// ====================================================================

interface ServiceFeedbackResult {
  status?: string;
  qrCodeID?: string;
  externalReferenceID?: string;
  shortUrl?: string;
  viewUrl?: string;
  qrImageUrl?: string;
  qrImageBase64?: string;
  expiresOn?: string;
  createdOn?: string;
  code?: string;
  message?: string;
  field?: string;
  // post-create upload outcome (spliced in client-side; not returned by the
  // upstream Create endpoint).
  uploadedImage?: { imageUrl?: string; error?: string };
}

interface ImageSlotState {
  mode: 'url' | 'file';
  url: string;
  file: File | null;
  previewUrl: string | null;   // object-URL for inline preview
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const DEFAULTS = {
  name:                'Hotel — Front desk',
  description:         'Welcome-desk experience survey, lobby tower A',
  externalReferenceID: 'HOTEL-FRONTDESK-A',

  serviceTitle:       'How was your check-in?',
  serviceDescription: 'Help us improve the welcome experience.',
  thankYouMessage:    'Thank you! A manager will read every response.',
  brandColor:         '#1d62c4',

  enableImageUpload:    true,
  requireContactInfo:   false,

  returnImage: false,
};

function emptySlot(): ImageSlotState {
  return { mode: 'url', url: '', file: null, previewUrl: null };
}

export default function ServiceFeedbackPage() {
  // Envelope
  const [name, setName]                       = useState(DEFAULTS.name);
  const [description, setDescription]         = useState(DEFAULTS.description);
  const [externalReferenceID, setExternalRef] = useState(DEFAULTS.externalReferenceID);

  // Payload — copy
  const [serviceTitle, setServiceTitle]             = useState(DEFAULTS.serviceTitle);
  const [serviceDescription, setServiceDescription] = useState(DEFAULTS.serviceDescription);
  const [thankYouMessage, setThankYouMessage]       = useState(DEFAULTS.thankYouMessage);
  const [brandColor, setBrandColor]                 = useState(DEFAULTS.brandColor);

  // Hero image — single slot. URL or file upload.
  const [image, setImage] = useState<ImageSlotState>(emptySlot());

  // Toggles
  const [enableImageUpload, setEnableImageUpload]   = useState(DEFAULTS.enableImageUpload);
  const [requireContactInfo, setRequireContactInfo] = useState(DEFAULTS.requireContactInfo);

  // Options
  const [returnImage, setReturnImage] = useState(DEFAULTS.returnImage);

  // UI state
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [request, setRequest]   = useState<RequestLog | null>(null);
  const [response, setResponse] = useState<ResponseLog | null>(null);

  function pickFile(f: File | null): string | null {
    if (!f) {
      setImage({ ...image, file: null, previewUrl: null });
      return null;
    }
    if (!ALLOWED_MIMES.includes(f.type)) {
      return `Unsupported file type: "${f.type || 'unknown'}". Use JPEG, PNG, or WEBP.`;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      return `File too large: ${(f.size / 1024 / 1024).toFixed(2)} MB. Max 5 MB.`;
    }
    setImage({ mode: 'file', url: '', file: f, previewUrl: URL.createObjectURL(f) });
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setProgress('Creating QR…');

    // Phase 1 — create the QR. If the image slot is in URL mode we pass the
    // URL; if it's in file mode we leave serviceImageUrl undefined and
    // upload separately in Phase 2.
    const payload = {
      name:                name.trim()                || undefined,
      description:         description.trim()         || undefined,
      externalReferenceID: externalReferenceID.trim() || undefined,
      serviceFeedback: {
        serviceTitle:        serviceTitle.trim(),
        serviceDescription:  serviceDescription.trim() || undefined,
        thankYouMessage:     thankYouMessage.trim()    || undefined,
        brandColor:          brandColor.trim()         || undefined,
        serviceImageUrl:     image.mode === 'url' ? (image.url.trim() || undefined) : undefined,
        enableImageUpload,
        requireContactInfo,
      },
      returnImage,
    };

    const createUrl = '/api/qr/service-feedback';
    setRequest({ method: 'POST', url: createUrl, body: payload, sentAt: new Date().toISOString() });

    const start = performance.now();
    let createBody: ServiceFeedbackResult | null = null;
    try {
      const res = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      createBody = await res.json();

      // If create failed, surface immediately — no upload to attempt.
      if (!res.ok || !createBody?.qrCodeID) {
        setResponse({
          status: res.status, statusText: res.statusText, ok: res.ok,
          body: createBody ?? {}, durationMs: Math.round(performance.now() - start),
        });
        return;
      }

      // Phase 2 — upload the picked file, if any.
      let uploadedImage: ServiceFeedbackResult['uploadedImage'] | undefined;
      if (image.mode === 'file' && image.file) {
        setProgress('Uploading hero image…');
        const form = new FormData();
        form.append('file', image.file);
        const upUrl = `/api/qr/${encodeURIComponent(createBody.qrCodeID!)}/upload-image`;
        try {
          const upRes = await fetch(upUrl, { method: 'POST', body: form });
          const upBody = await upRes.json();
          uploadedImage = (upRes.ok && upBody?.imageUrl)
            ? { imageUrl: upBody.imageUrl }
            : { error: upBody?.message || `Upload failed (HTTP ${upRes.status})` };
        } catch (err: unknown) {
          uploadedImage = { error: err instanceof Error ? err.message : 'Network error' };
        }
      }

      const merged: ServiceFeedbackResult = {
        ...createBody,
        uploadedImage,
      };
      setResponse({
        status: res.status, statusText: res.statusText, ok: res.ok,
        body: merged, durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setResponse({
        status: 0, statusText: 'Network Error', ok: false,
        body: { status: 'error', code: 'NETWORK_ERROR', message } satisfies ServiceFeedbackResult,
        durationMs: Math.round(performance.now() - start),
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  function reset() {
    setName(DEFAULTS.name);
    setDescription(DEFAULTS.description);
    setExternalRef(DEFAULTS.externalReferenceID);
    setServiceTitle(DEFAULTS.serviceTitle);
    setServiceDescription(DEFAULTS.serviceDescription);
    setThankYouMessage(DEFAULTS.thankYouMessage);
    setBrandColor(DEFAULTS.brandColor);
    setImage(emptySlot());
    setEnableImageUpload(DEFAULTS.enableImageUpload);
    setRequireContactInfo(DEFAULTS.requireContactInfo);
    setReturnImage(DEFAULTS.returnImage);
    setRequest(null);
    setResponse(null);
    setProgress(null);
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Support Hub — Single create</h1>
        <p className="text-gray-500 text-sm mt-1">
          POST <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/public/qr/service-feedback</code> +
          inline image upload — picked files are uploaded to the QR after it&apos;s created.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        {/* ── Form column ──────────────────────────────── */}
        <form onSubmit={submit}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">

          <Section title="Request metadata" subtitle="Dashboard label, free-text notes, your own ID mapping">
            <Grid>
              <Field label="Name">
                <input value={name} onChange={e => setName(e.target.value)}
                       className={inputClass} placeholder="Hotel — Front desk" maxLength={200} />
              </Field>
              <Field label="External Reference ID" hint="Used to correlate responses to your CRM record">
                <input value={externalReferenceID} onChange={e => setExternalRef(e.target.value)}
                       className={inputClass} placeholder="HOTEL-FRONTDESK-A" maxLength={100} />
              </Field>
              <Field label="Description" full>
                <input value={description} onChange={e => setDescription(e.target.value)}
                       className={inputClass} placeholder="Short internal note" maxLength={500} />
              </Field>
            </Grid>
          </Section>

          <Section title="Feedback page" subtitle="Headline + copy customers see when they scan">
            <Grid>
              <Field label="Service title *" full>
                <input value={serviceTitle} onChange={e => setServiceTitle(e.target.value)}
                       className={inputClass} required maxLength={200}
                       placeholder="How was your check-in?" />
              </Field>
              <Field label="Service description" full>
                <textarea value={serviceDescription} onChange={e => setServiceDescription(e.target.value)}
                          className={inputClass + ' h-20'} maxLength={2000}
                          placeholder="Help us improve…" />
              </Field>
              <Field label="Thank-you message" full>
                <input value={thankYouMessage} onChange={e => setThankYouMessage(e.target.value)}
                       className={inputClass} maxLength={500}
                       placeholder="Thank you! A manager will read every response." />
              </Field>
            </Grid>
          </Section>

          <Section title="Branding & imagery"
                   subtitle="The hero image accepts either a public URL or a file you upload directly.">
            <div className="mb-4">
              <Field label="Brand color">
                <div className="flex gap-2">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                         className="w-10 h-10 border border-gray-300 rounded" />
                  <input value={brandColor} onChange={e => setBrandColor(e.target.value)}
                         className={inputClass} placeholder="#1d62c4" />
                </div>
              </Field>
            </div>

            <ImageSlotRow label="Hero image" state={image}
                          onModeChange={mode => setImage({ ...image, mode, url: mode === 'url' ? image.url : '', file: null, previewUrl: null })}
                          onUrlChange={url => setImage({ ...image, url })}
                          onFile={pickFile} />
          </Section>

          <Section title="Form behaviour">
            <div className="space-y-3">
              <Toggle checked={enableImageUpload} onChange={setEnableImageUpload}
                      label="Customer can attach a photo to their feedback" />
              <Toggle checked={requireContactInfo} onChange={setRequireContactInfo}
                      label="Ask for name + email before submission" />
            </div>
          </Section>

          <Section title="Options">
            <Toggle checked={returnImage} onChange={setReturnImage}
                    label="Include base64 QR image in response (returnImage: true)" />
          </Section>

          <div className="p-5 flex items-center justify-end gap-2 bg-gray-50">
            {progress && (
              <span className="text-xs text-blue-700 mr-auto inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                {progress}
              </span>
            )}
            <button type="button" onClick={reset} disabled={loading}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700
                               bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium">
              Reset
            </button>
            <button type="submit" disabled={loading || !serviceTitle.trim()}
                    className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               text-white text-sm font-medium">
              {loading ? 'Working…' : 'Create Feedback QR'}
            </button>
          </div>
        </form>

        {/* ── Request / Response column ────────────────── */}
        <aside className="lg:sticky lg:top-4 space-y-4">
          <RequestPanel request={request} />
          <ResponsePanel response={response} loading={loading} highlights={renderHighlights} />
        </aside>
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────
// Layout helpers
// ────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm ' +
  'focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ' +
  'placeholder:text-gray-400';

function Section({ title, subtitle, children }:
  { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="p-5">
      <header className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, hint, full, children }:
  { label: string; hint?: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-2">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }:
  { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
             className="accent-blue-600 w-4 h-4" />
      {label}
    </label>
  );
}

// ────────────────────────────────────────────────────────
// Per-slot image input — segmented toggle between URL and File
// ────────────────────────────────────────────────────────
function ImageSlotRow({
  label, state, onModeChange, onUrlChange, onFile,
}: {
  label: string;
  state: ImageSlotState;
  onModeChange: (mode: 'url' | 'file') => void;
  onUrlChange: (url: string) => void;
  onFile: (f: File | null) => string | null;
}) {
  const [pickError, setPickError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setPickError(null);
    const f = e.target.files?.[0] ?? null;
    const err = onFile(f);
    if (err) setPickError(err);
  }

  return (
    <div className="border border-gray-200 rounded-md p-3 bg-gray-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <div className="inline-flex bg-white border border-gray-200 rounded p-0.5">
          <button type="button"
                  onClick={() => onModeChange('url')}
                  className={
                    'px-2.5 py-0.5 text-[11px] rounded font-medium transition-colors ' +
                    (state.mode === 'url'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-800')
                  }>
            URL
          </button>
          <button type="button"
                  onClick={() => onModeChange('file')}
                  className={
                    'px-2.5 py-0.5 text-[11px] rounded font-medium transition-colors ' +
                    (state.mode === 'file'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-800')
                  }>
            Upload
          </button>
        </div>
      </div>

      {state.mode === 'url' ? (
        <input value={state.url} onChange={e => onUrlChange(e.target.value)}
               className={inputClass} type="url"
               placeholder="https://cdn.example.com/image.jpg" />
      ) : (
        <div className="space-y-2">
          <input type="file" accept="image/jpeg,image/png,image/webp"
                 onChange={handleFile}
                 className="block w-full text-xs text-gray-700
                            file:mr-3 file:px-3 file:py-1.5 file:rounded
                            file:border-0 file:bg-blue-50 file:text-blue-700
                            file:font-medium hover:file:bg-blue-100" />
          {pickError && (
            <p className="text-[11px] text-red-700">{pickError}</p>
          )}
          {state.previewUrl && state.file && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.previewUrl} alt="Preview"
                   className="w-16 h-16 object-cover rounded border border-gray-200" />
              <div className="text-[11px] text-gray-500 min-w-0">
                <div className="truncate">{state.file.name}</div>
                <div>{(state.file.size / 1024).toFixed(1)} KB · {state.file.type}</div>
                <div className="text-blue-700 mt-0.5">Will upload after QR is created.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Response highlights — includes upload outcomes
// ────────────────────────────────────────────────────────
function renderHighlights(body: unknown): ReactNode {
  if (!body || typeof body !== 'object') return null;
  const r = body as ServiceFeedbackResult;

  const rows: Array<[string, ReactNode]> = [];
  if (r.qrCodeID)               rows.push(['QR Code ID',  <code key="qid" className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{r.qrCodeID}</code>]);
  if (r.externalReferenceID)    rows.push(['External Ref',<code key="ref" className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{r.externalReferenceID}</code>]);
  if (r.shortUrl)               rows.push(['Short URL',   <a key="su" href={r.shortUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{r.shortUrl}</a>]);
  if (r.viewUrl)                rows.push(['View URL',    <a key="vu" href={r.viewUrl}  target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{r.viewUrl}</a>]);
  if (r.expiresOn)              rows.push(['Expires',     <span key="ex" className="text-gray-700">{r.expiresOn}</span>]);
  if (r.code && !r.qrCodeID)    rows.push(['Error code',  <code key="ec" className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[11px]">{r.code}</code>]);
  if (r.message && !r.qrCodeID) rows.push(['Message',     <span key="ms" className="text-red-700">{r.message}</span>]);
  if (r.field)                  rows.push(['Field',       <code key="fd" className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[11px]">{r.field}</code>]);

  const qrSrc = r.qrImageBase64 || r.qrImageUrl;
  if (rows.length === 0 && !qrSrc && !r.uploadedImage) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-100 space-y-1.5 text-xs">
      {rows.map(([label, val]) => (
        <div key={label} className="flex items-baseline gap-3">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide w-24 flex-shrink-0">
            {label}
          </span>
          <span className="flex-1 min-w-0">{val}</span>
        </div>
      ))}

      {r.uploadedImage && (
        <div className="pt-2 border-t border-gray-100 mt-2">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
            Uploaded hero image
          </div>
          {r.uploadedImage.imageUrl ? (
            <a href={r.uploadedImage.imageUrl} target="_blank" rel="noreferrer"
               className="text-blue-600 hover:underline break-all">
              {r.uploadedImage.imageUrl}
            </a>
          ) : (
            <span className="text-red-700">{r.uploadedImage.error}</span>
          )}
        </div>
      )}

      {qrSrc && (
        <div className="pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR"
               className="max-w-[160px] border border-gray-200 rounded-md bg-white p-2" />
        </div>
      )}
    </div>
  );
}
