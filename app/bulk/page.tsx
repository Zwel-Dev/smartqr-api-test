'use client';

import { useMemo, useState } from 'react';

// ────────────────────────────────────────────────────────
// Sample — three realistic VCard records, fully populated.
// Used by the "Load sample" button.
// ────────────────────────────────────────────────────────
const SAMPLE = {
  items: [
    {
      name: 'Alice Lim — Sales',
      description: 'Asia-Pacific sales contact',
      externalReferenceID: 'EMP-1001',
      vcard: {
        fullName: 'Alice Lim',
        phone: '+95-9-123-456-789',
        altPhone: '+95-1-555-1001',
        email: 'alice.lim@example.com',
        website: 'https://example.com/alice',
        companyName: 'Example Co.',
        companyTitle: 'Senior Sales Lead',
        summaryText: 'Reach me anytime for partnership and enterprise questions.',
        address: {
          street: '123 Sule Pagoda Road',
          postalCode: '11181',
          city: 'Yangon',
          state: 'Yangon Region',
          country: 'Myanmar',
        },
      },
    },
    {
      name: 'Bob Tan — Engineering',
      description: 'Platform team manager, APAC office',
      externalReferenceID: 'EMP-1002',
      vcard: {
        fullName: 'Bob Tan',
        phone: '+65-9123-4567',
        altPhone: '+65-6555-2002',
        email: 'bob.tan@example.com',
        website: 'https://example.com/engineering',
        companyName: 'Example Co.',
        companyTitle: 'Engineering Manager',
        summaryText: 'Builds the platform that powers the rest of the company.',
        address: {
          street: '1 Marina Boulevard, #20-01',
          postalCode: '018989',
          city: 'Singapore',
          state: 'Central Region',
          country: 'Singapore',
        },
      },
    },
    {
      name: 'Catherine Hayes — Marketing',
      description: 'EMEA marketing director',
      externalReferenceID: 'EMP-1003',
      vcard: {
        fullName: 'Catherine Hayes',
        phone: '+44-20-7946-0958',
        altPhone: '+44-7700-900-123',
        email: 'catherine.hayes@example.com',
        website: 'https://example.com/catherine',
        companyName: 'Example Co.',
        companyTitle: 'Marketing Director, EMEA',
        summaryText: 'Brand, content, and product marketing for the EMEA region.',
        address: {
          street: '10 Old Bailey',
          postalCode: 'EC4M 7NG',
          city: 'London',
          state: 'England',
          country: 'United Kingdom',
        },
      },
    },
  ],
};
const SAMPLE_JSON = JSON.stringify(SAMPLE, null, 2);

// ────────────────────────────────────────────────────────
// Result types
// ────────────────────────────────────────────────────────
interface BatchItemResult {
  index: number;
  status: 'success' | 'error';
  externalReferenceID?: string;
  data?: {
    qrCodeID?: string;
    shortUrl?: string;
    viewUrl?: string;
  };
  error?: {
    code?: string;
    message?: string;
    field?: string;
  };
}
interface BatchResponse {
  status?: 'success' | 'partial' | 'error';
  total?: number;
  succeeded?: number;
  failed?: number;
  results?: BatchItemResult[];
  // Error envelope when the whole batch is rejected
  code?: string;
  message?: string;
  field?: string;
}

export default function BulkPage() {
  const [json, setJson]         = useState<string>(SAMPLE_JSON);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<BatchResponse | null>(null);
  const [parseErr, setParseErr] = useState<string | null>(null);

  /** Live item count + size badge so the user sees they're under the 100 cap. */
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
    setLoading(true);
    setResult(null);
    setParseErr(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e: unknown) {
      setParseErr(e instanceof Error ? e.message : 'Invalid JSON');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/qr/vcard/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      setResult(await res.json());
    } catch (err: unknown) {
      setResult({
        status: 'error',
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setJson(SAMPLE_JSON);
    setResult(null);
    setParseErr(null);
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk VCard create</h1>
        <p className="text-gray-500 text-sm mt-1">
          POST <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/public/qr/vcard:batch</code> — up to 100 items per call.
          Per-item failures don&apos;t roll back the batch.
        </p>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* ── Editor ──────────────────────────────────── */}
        <div className="p-5 border-b border-gray-100">
          <header className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700">Request body</h2>
            <div className="flex items-center gap-3 text-xs">
              <span
                className={
                  meta.error
                    ? 'text-red-600 font-medium'
                    : meta.count > 100
                      ? 'text-red-600 font-medium'
                      : 'text-gray-500'
                }>
                {meta.error
                  ? `JSON error: ${meta.error}`
                  : `${meta.count} item${meta.count === 1 ? '' : 's'}${meta.count > 100 ? ' (max 100)' : ''}`}
              </span>
              <button
                type="button"
                onClick={loadSample}
                disabled={loading}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700
                           bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-medium">
                Load sample
              </button>
            </div>
          </header>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
            className="w-full h-96 font-mono text-xs p-3 border border-gray-300 rounded-md
                       bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600
                       focus:ring-2 focus:ring-blue-100 leading-relaxed"
          />
        </div>

        {/* ── Actions ─────────────────────────────────── */}
        <div className="p-5 flex items-center justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={submit}
            disabled={loading || !!meta.error || meta.count === 0 || meta.count > 100}
            className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white text-sm font-medium">
            {loading ? 'Submitting…' : `Submit batch (${meta.count})`}
          </button>
        </div>
      </section>

      {parseErr && (
        <div className="mt-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          JSON error: {parseErr}
        </div>
      )}

      {result && <ResultPanel result={result} />}
    </main>
  );
}

// ────────────────────────────────────────────────────────
// Result panel — aggregate counts + per-item table
// ────────────────────────────────────────────────────────
function ResultPanel({ result }: { result: BatchResponse }) {
  const hasResults = Array.isArray(result.results) && result.results.length > 0;
  const statusLabel = result.status ?? (hasResults ? 'partial' : 'error');
  const dot =
    statusLabel === 'success' ? 'bg-emerald-500'
    : statusLabel === 'partial' ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <section className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <header className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <h2 className="font-semibold text-sm text-gray-900">Batch result</h2>
        <span className="ml-2 text-xs uppercase tracking-wide text-gray-500 font-medium">
          {statusLabel}
        </span>
      </header>

      {/* Aggregate counts */}
      {hasResults && (
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <Stat label="Total"      value={result.total ?? 0} />
          <Stat label="Succeeded"  value={result.succeeded ?? 0}  tint="text-emerald-700" />
          <Stat label="Failed"     value={result.failed ?? 0}     tint="text-red-700" />
        </div>
      )}

      {/* Envelope-level error (whole batch rejected) */}
      {!hasResults && (result.code || result.message) && (
        <div className="p-5 text-sm text-red-700">
          <strong>{result.code || 'ERROR'}</strong>: {result.message || 'Unknown error'}
          {result.field && <p className="text-xs mt-1 text-red-600">Field: <code>{result.field}</code></p>}
        </div>
      )}

      {/* Per-item table */}
      {hasResults && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <th className="px-4 py-2 text-left font-medium">#</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">External Ref</th>
                <th className="px-4 py-2 text-left font-medium">QR ID / Error</th>
                <th className="px-4 py-2 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {result.results!.map((r) => (
                <tr key={r.index} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 align-top">{r.index}</td>
                  <td className="px-4 py-2 align-top">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-2 align-top">
                    {r.externalReferenceID ? (
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{r.externalReferenceID}</code>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top">
                    {r.status === 'success' && r.data?.qrCodeID && (
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{r.data.qrCodeID}</code>
                    )}
                    {r.status === 'error' && r.error && (
                      <div className="text-xs">
                        <strong className="text-red-700">{r.error.code}</strong>
                        <span className="text-red-600">: {r.error.message}</span>
                        {r.error.field && (
                          <span className="text-red-500 ml-1">({r.error.field})</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top">
                    {r.status === 'success' && r.data?.viewUrl && (
                      <a href={r.data.viewUrl} target="_blank" rel="noreferrer"
                         className="text-blue-600 text-xs hover:underline">
                        Open ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw response */}
      <details className="p-4 border-t border-gray-100">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">Raw response</summary>
        <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto leading-relaxed">
{JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div className="px-4 py-3 text-center">
      <div className={`text-2xl font-bold ${tint ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}
