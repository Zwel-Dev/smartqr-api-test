'use client';

import { useState, type ReactNode } from 'react';
import {
  RequestPanel, ResponsePanel,
  type RequestLog, type ResponseLog,
} from '@/app/components/io-panels';

interface WebsiteResult {
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
}

const DEFAULTS = {
  name:                'Spring Campaign Landing',
  description:         'Q2 2026 lead-gen page.',
  externalReferenceID: 'CAMPAIGN-2026-Q2',
  targetUrl:           'https://example.com/landing/spring-2026',
  displayTitle:        'Spring Campaign 2026',
  subText:             'Redirecting you to our new landing page…',
  returnImage:         false,
};

export default function WebsitePage() {
  // Request metadata
  const [name, setName]                       = useState(DEFAULTS.name);
  const [description, setDescription]         = useState(DEFAULTS.description);
  const [externalReferenceID, setExternalRef] = useState(DEFAULTS.externalReferenceID);

  // Website payload
  const [targetUrl,    setTargetUrl]    = useState(DEFAULTS.targetUrl);
  const [displayTitle, setDisplayTitle] = useState(DEFAULTS.displayTitle);
  const [subText,      setSubText]      = useState(DEFAULTS.subText);

  // Options
  const [returnImage, setReturnImage] = useState(DEFAULTS.returnImage);

  // UI state
  const [loading, setLoading]   = useState(false);
  const [request, setRequest]   = useState<RequestLog | null>(null);
  const [response, setResponse] = useState<ResponseLog | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    const payload = {
      name:                name.trim()                || undefined,
      description:         description.trim()         || undefined,
      externalReferenceID: externalReferenceID.trim() || undefined,
      website: {
        targetUrl:    targetUrl.trim(),
        displayTitle: displayTitle.trim() || undefined,
        subText:      subText.trim()      || undefined,
      },
      returnImage,
    };

    const url = '/api/qr/website';
    setRequest({
      method: 'POST',
      url,
      body: payload,
      sentAt: new Date().toISOString(),
    });

    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      setResponse({
        status:     res.status,
        statusText: res.statusText,
        ok:         res.ok,
        body,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setResponse({
        status:     0,
        statusText: 'Network Error',
        ok:         false,
        body:       { status: 'error', code: 'NETWORK_ERROR', message } satisfies WebsiteResult,
        durationMs: Math.round(performance.now() - start),
      });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName(DEFAULTS.name);
    setDescription(DEFAULTS.description);
    setExternalRef(DEFAULTS.externalReferenceID);
    setTargetUrl(DEFAULTS.targetUrl);
    setDisplayTitle(DEFAULTS.displayTitle);
    setSubText(DEFAULTS.subText);
    setReturnImage(DEFAULTS.returnImage);
    setRequest(null);
    setResponse(null);
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Website QR — Single create</h1>
        <p className="text-gray-500 text-sm mt-1">
          POST <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/public/qr/website</code> via
          a Next.js server function that keeps the API key on the server.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        {/* ── Form column ──────────────────────────────── */}
        <form onSubmit={submit}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">

          <Section title="Request metadata"
                   subtitle="Dashboard label, free-text notes, your own ID mapping">
            <Grid>
              <Field label="Name" hint="Shown in your Smart_QR dashboard">
                <input value={name} onChange={e => setName(e.target.value)}
                       className={inputClass} placeholder="Spring Campaign Landing" maxLength={200} />
              </Field>
              <Field label="External Reference ID" hint="">
                <input value={externalReferenceID} onChange={e => setExternalRef(e.target.value)}
                       className={inputClass} placeholder="CAMPAIGN-2026-Q2" maxLength={100} />
              </Field>
              <Field label="Description" full>
                <input value={description} onChange={e => setDescription(e.target.value)}
                       className={inputClass} placeholder="Q2 2026 lead-gen page." maxLength={500} />
              </Field>
            </Grid>
          </Section>

          <Section title="Website"
                   subtitle="Target URL required (http/https, no userinfo, no private hosts)">
            <Grid>
              <Field label="Target URL *" hint="≤ 2048 chars, http or https" full>
                <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
                       className={inputClass} required type="url"
                       placeholder="https://example.com/landing/spring-2026" maxLength={2048} />
              </Field>
              <Field label="Display title" hint="≤ 100 chars" full>
                <input value={displayTitle} onChange={e => setDisplayTitle(e.target.value)}
                       className={inputClass} placeholder="Spring Campaign 2026" maxLength={100} />
              </Field>
              <Field label="Sub-text" hint="≤ 300 chars" full>
                <input value={subText} onChange={e => setSubText(e.target.value)}
                       className={inputClass} placeholder="Redirecting you to the landing page…" maxLength={300} />
              </Field>
            </Grid>
          </Section>

          <Section title="Options">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={returnImage}
                     onChange={e => setReturnImage(e.target.checked)}
                     className="accent-blue-600 w-4 h-4" />
              Include base64 QR image in response (<code>returnImage: true</code>)
            </label>
          </Section>

          <div className="p-5 flex items-center justify-end gap-2 bg-gray-50">
            <button type="button" onClick={reset} disabled={loading}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700
                               bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium">
              Reset
            </button>
            <button type="submit" disabled={loading || !targetUrl.trim()}
                    className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               text-white text-sm font-medium">
              {loading ? 'Creating…' : 'Create Website QR'}
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
// Layout helpers (mirror VCard page so the two feel like siblings)
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

/** Compact, human-readable highlights from a typical Smart_QR website response. */
function renderHighlights(body: unknown): ReactNode {
  if (!body || typeof body !== 'object') return null;
  const r = body as WebsiteResult;

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
  if (rows.length === 0 && !qrSrc) return null;

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
