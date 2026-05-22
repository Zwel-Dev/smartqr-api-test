'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  RequestPanel, ResponsePanel,
  type RequestLog, type ResponseLog,
} from '@/app/components/io-panels';

// Three realistic samples covering the common Customer Support Hub use cases:
// hospitality (hotel front desk), F&B (restaurant table), software support
// (post-ticket survey).
const SAMPLE = {
  items: [
    {
      name: 'Hotel — Front desk',
      description: 'Welcome-desk experience, lobby tower A',
      externalReferenceID: 'HOTEL-FRONTDESK-A',
      serviceFeedback: {
        serviceTitle:    'How was your check-in?',
        thankYouMessage: 'Thank you! A manager will read every response.',
        brandColor:      '#1d62c4',
        enableImageUpload: true,
      },
    },
    {
      name: 'Restaurant — Table 5',
      description: 'Dinner service feedback',
      externalReferenceID: 'RESTO-T05',
      serviceFeedback: {
        serviceTitle:       'How was your meal?',
        serviceDescription: '30-second survey — we read every response.',
        thankYouMessage:    "We'd love to see you again.",
        brandColor:         '#0F766E',
        requireContactInfo: true,
      },
    },
    {
      name: 'Support — Email signature',
      description: 'Post-ticket CSAT survey link',
      externalReferenceID: 'SUPPORT-EMAIL',
      serviceFeedback: {
        serviceTitle:       'Did we solve your issue?',
        serviceDescription: '30-second survey for the ticket we just closed.',
        brandColor:         '#196CD4',
      },
    },
  ],
};
const SAMPLE_JSON = JSON.stringify(SAMPLE, null, 2);

interface BatchItemResult {
  index: number;
  status: 'success' | 'error';
  externalReferenceID?: string;
  data?: { qrCodeID?: string; shortUrl?: string; viewUrl?: string };
  error?: { code?: string; message?: string; field?: string };
}
interface BatchResponse {
  status?: 'success' | 'partial' | 'error';
  total?: number;
  succeeded?: number;
  failed?: number;
  results?: BatchItemResult[];
  code?: string;
  message?: string;
  field?: string;
}

export default function ServiceFeedbackBulkPage() {
  const [json, setJson]         = useState<string>(SAMPLE_JSON);
  const [loading, setLoading]   = useState(false);
  const [request, setRequest]   = useState<RequestLog | null>(null);
  const [response, setResponse] = useState<ResponseLog | null>(null);
  const [parseErr, setParseErr] = useState<string | null>(null);

  const meta = useMemo(() => {
    try {
      const parsed = JSON.parse(json);
      const count = Array.isArray(parsed?.items) ? parsed.items.length : 0;
      return { count, error: null as string | null };
    } catch (e: unknown) {
      return { count: 0, error: e instanceof Error ? e.message : String(e) };
    }
  }, [json]);

  async function submit() {
    setLoading(true); setResponse(null); setParseErr(null);

    let parsed: unknown;
    try { parsed = JSON.parse(json); }
    catch (e: unknown) {
      setParseErr(e instanceof Error ? e.message : 'Invalid JSON');
      setLoading(false);
      return;
    }

    const url = '/api/qr/service-feedback/batch';
    setRequest({ method: 'POST', url, body: parsed, sentAt: new Date().toISOString() });

    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const body = await res.json();
      setResponse({
        status: res.status, statusText: res.statusText, ok: res.ok, body,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setResponse({
        status: 0, statusText: 'Network Error', ok: false,
        body: { status: 'error', code: 'NETWORK_ERROR', message },
        durationMs: Math.round(performance.now() - start),
      });
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setJson(SAMPLE_JSON); setRequest(null); setResponse(null); setParseErr(null);
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Customer Support Hub create</h1>
        <p className="text-gray-500 text-sm mt-1">
          POST <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/public/qr/service-feedback:batch</code> —
          up to 100 items per call. Per-item failures don&apos;t roll back the batch.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <header className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700">Request body</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className={
                  meta.error || meta.count > 100
                    ? 'text-red-600 font-medium'
                    : 'text-gray-500'
                }>
                  {meta.error
                    ? `JSON error: ${meta.error}`
                    : `${meta.count} item${meta.count === 1 ? '' : 's'}${meta.count > 100 ? ' (max 100)' : ''}`}
                </span>
                <button type="button" onClick={loadSample} disabled={loading}
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-700
                                   bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-medium">
                  Load sample
                </button>
              </div>
            </header>
            <textarea
              value={json} onChange={e => setJson(e.target.value)} spellCheck={false}
              className="w-full h-[32rem] font-mono text-xs p-3 border border-gray-300 rounded-md
                         bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600
                         focus:ring-2 focus:ring-blue-100 leading-relaxed"
            />
          </div>

          <div className="p-5 flex items-center justify-end gap-2 bg-gray-50">
            <button type="button" onClick={submit}
                    disabled={loading || !!meta.error || meta.count === 0 || meta.count > 100}
                    className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               text-white text-sm font-medium">
              {loading ? 'Submitting…' : `Submit batch (${meta.count})`}
            </button>
          </div>

          {parseErr && (
            <div className="m-5 mt-0 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
              JSON error: {parseErr}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-4 space-y-4">
          <RequestPanel request={request} />
          <ResponsePanel response={response} loading={loading} highlights={renderHighlights} />
        </aside>
      </div>
    </main>
  );
}

function renderHighlights(body: unknown): ReactNode {
  if (!body || typeof body !== 'object') return null;
  const r = body as BatchResponse;
  const hasResults = Array.isArray(r.results) && r.results.length > 0;

  if (!hasResults && (r.code || r.message)) {
    return (
      <div className="px-4 py-3 border-b border-gray-100 text-xs text-red-700">
        <strong>{r.code || 'ERROR'}</strong>: {r.message || 'Unknown error'}
        {r.field && <span className="ml-2 text-red-600">(field: <code>{r.field}</code>)</span>}
      </div>
    );
  }

  if (!hasResults) return null;

  return (
    <div className="border-b border-gray-100">
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <Stat label="Total"     value={r.total ?? 0} />
        <Stat label="Succeeded" value={r.succeeded ?? 0} tint="text-emerald-700" />
        <Stat label="Failed"    value={r.failed ?? 0}    tint="text-red-700" />
      </div>

      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-[10px] uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Ref</th>
              <th className="px-3 py-2 text-left font-medium">QR ID / Error</th>
              <th className="px-3 py-2 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {r.results!.map(row => (
              <tr key={row.index} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-500 align-top">{row.index}</td>
                <td className="px-3 py-2 align-top"><StatusPill status={row.status} /></td>
                <td className="px-3 py-2 align-top">
                  {row.externalReferenceID
                    ? <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{row.externalReferenceID}</code>
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-3 py-2 align-top">
                  {row.status === 'success' && row.data?.qrCodeID && (
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] break-all">{row.data.qrCodeID}</code>
                  )}
                  {row.status === 'error' && row.error && (
                    <div className="leading-snug">
                      <strong className="text-red-700">{row.error.code}</strong>
                      <span className="text-red-600">: {row.error.message}</span>
                      {row.error.field && <span className="text-red-500 ml-1">({row.error.field})</span>}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  {row.status === 'success' && row.data?.viewUrl && (
                    <a href={row.data.viewUrl} target="_blank" rel="noreferrer"
                       className="text-blue-600 hover:underline whitespace-nowrap">
                      Open ↗
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div className="px-3 py-2 text-center">
      <div className={`text-xl font-bold ${tint ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls = status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}
