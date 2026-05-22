'use client';

import { useState, type ReactNode } from 'react';

// ====================================================================
// Customer Support Hub — Responses browser
//
// This is the headline tester for the QR type: it lets you punch in a
// QR Code ID and pull both the aggregate analytics AND the latest
// customer responses in one go — the same shape an integrator's CRM
// would use when polling /feedback-responses + /feedback-analytics on
// a timer.
// ====================================================================

interface AnalyticsResponse {
  qrCodeID?: string;
  from?: string;
  to?: string;
  totalResponses?: number;
  averageRating?: number;
  ratingDistribution?: Record<string, number>;
  promoterCount?: number;
  passiveCount?: number;
  detractorCount?: number;
  code?: string;
  message?: string;
  field?: string;
}

interface FeedbackRow {
  feedbackID?: string;
  qrCodeID?: string;
  externalReferenceID?: string;
  rating?: number;
  comment?: string;
  imageUrls?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  submittedOn?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ResponseListPayload {
  status?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  items?: FeedbackRow[];
  code?: string;
  message?: string;
  field?: string;
}

export default function ResponsesBrowserPage() {
  // Inputs
  const [qrCodeId, setQrCodeId] = useState('');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [minStars, setMinStars] = useState('');
  const [maxStars, setMaxStars] = useState('');
  const [limit, setLimit]       = useState('25');
  const [offset, setOffset]     = useState('0');

  // UI state
  const [loading, setLoading]     = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [list, setList]           = useState<ResponseListPayload | null>(null);
  const [error, setError]         = useState<string | null>(null);

  async function fetchAll() {
    if (!qrCodeId.trim()) {
      setError('Enter a QR Code ID first.');
      return;
    }
    setLoading(true); setError(null); setAnalytics(null); setList(null);

    // Build query strings — only include filters the user actually set.
    const responseParams = new URLSearchParams();
    if (from.trim())     responseParams.set('from', new Date(from).toISOString());
    if (to.trim())       responseParams.set('to',   new Date(to).toISOString());
    if (minStars.trim()) responseParams.set('minStars', minStars);
    if (maxStars.trim()) responseParams.set('maxStars', maxStars);
    if (limit.trim())    responseParams.set('limit',    limit);
    if (offset.trim())   responseParams.set('offset',   offset);

    const analyticsParams = new URLSearchParams();
    if (from.trim()) analyticsParams.set('from', new Date(from).toISOString());
    if (to.trim())   analyticsParams.set('to',   new Date(to).toISOString());

    const id = encodeURIComponent(qrCodeId.trim());
    const responsesUrl = `/api/qr/${id}/feedback-responses?${responseParams.toString()}`;
    const analyticsUrl = `/api/qr/${id}/feedback-analytics?${analyticsParams.toString()}`;

    try {
      // Fire in parallel — same pattern an integrator would use.
      const [resB, anaB] = await Promise.all([
        fetch(responsesUrl).then(r => r.json()),
        fetch(analyticsUrl).then(r => r.json()),
      ]);
      setList(resB as ResponseListPayload);
      setAnalytics(anaB as AnalyticsResponse);

      // If either side is an error envelope, surface it.
      const listErr = (resB?.code && !resB?.items) ? resB.message : null;
      const anaErr  = (anaB?.code && anaB?.totalResponses === undefined) ? anaB.message : null;
      if (listErr || anaErr) setError(listErr || anaErr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQrCodeId(''); setFrom(''); setTo('');
    setMinStars(''); setMaxStars('');
    setLimit('25'); setOffset('0');
    setAnalytics(null); setList(null); setError(null);
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Support Hub — Responses browser</h1>
        <p className="text-gray-500 text-sm mt-1">
          Polls <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/feedback-responses</code> +
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs ml-1">/feedback-analytics</code> in parallel —
          the same call pattern an integrator&apos;s CRM would use.
        </p>
      </header>

      {/* ── Filter bar ─────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <Field label="QR Code ID *" full className="lg:col-span-3">
            <input value={qrCodeId} onChange={e => setQrCodeId(e.target.value)}
                   className={inputClass} placeholder="QR_01HKZ..." required />
          </Field>
          <Field label="From">
            <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}
                   className={inputClass} />
          </Field>
          <Field label="To">
            <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)}
                   className={inputClass} />
          </Field>
          <Field label="Min stars">
            <select value={minStars} onChange={e => setMinStars(e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="1">1</option><option value="2">2</option>
              <option value="3">3</option><option value="4">4</option>
              <option value="5">5</option>
            </select>
          </Field>
          <Field label="Max stars">
            <select value={maxStars} onChange={e => setMaxStars(e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="1">1</option><option value="2">2</option>
              <option value="3">3</option><option value="4">4</option>
              <option value="5">5</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <Field label="Limit" hint="1–100">
            <input type="number" min={1} max={100} value={limit} onChange={e => setLimit(e.target.value)}
                   className={inputClass} />
          </Field>
          <Field label="Offset">
            <input type="number" min={0} value={offset} onChange={e => setOffset(e.target.value)}
                   className={inputClass} />
          </Field>
          <div className="flex items-end gap-2">
            <button type="button" onClick={reset}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700
                               bg-white hover:bg-gray-50 text-sm font-medium">
              Reset
            </button>
            <button type="button" onClick={fetchAll} disabled={loading || !qrCodeId.trim()}
                    className="flex-1 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               text-white text-sm font-medium">
              {loading ? 'Fetching…' : 'Fetch responses + analytics'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Error banner ───────────────────────────────── */}
      {error && (
        <div className="mb-6 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Analytics tiles ────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <KpiTile label="Total responses" value={analytics?.totalResponses ?? '—'} tone="blue" />
        <KpiTile label="Average rating"
                 value={analytics?.averageRating != null
                   ? analytics.averageRating.toFixed(2)
                   : '—'}
                 tone="indigo" />
        <KpiTile label="Promoters (4–5★)" value={analytics?.promoterCount ?? '—'} tone="emerald" />
        <KpiTile label="Passive (3★)"     value={analytics?.passiveCount  ?? '—'} tone="amber" />
        <KpiTile label="Detractors (1–2★)" value={analytics?.detractorCount ?? '—'} tone="red" />
      </section>

      {/* ── Star distribution ──────────────────────────── */}
      {analytics?.ratingDistribution && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-3">
            Rating distribution
          </h2>
          <RatingBars distribution={analytics.ratingDistribution} />
        </section>
      )}

      {/* ── Responses table ────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <header className="px-5 py-3 border-b border-gray-100 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            Responses
          </h2>
          <span className="text-xs text-gray-500">
            {list?.items
              ? `${list.items.length} shown · ${list.total ?? 0} total · page ${list.page ?? 0}`
              : 'No data yet'}
          </span>
        </header>

        {(!list || !list.items || list.items.length === 0) && !loading && (
          <div className="p-10 text-center text-gray-400 text-sm">
            Enter a QR Code ID and click Fetch.
          </div>
        )}

        {list?.items && list.items.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {list.items.map((f, i) => (
              <FeedbackCard key={f.feedbackID || i} feedback={f} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// ────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm ' +
  'focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ' +
  'placeholder:text-gray-400';

function Field({ label, hint, full, className = '', children }:
  { label: string; hint?: string; full?: boolean; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''} ${className}`}>
      <span className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-2">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function KpiTile({ label, value, tone }:
  { label: string; value: ReactNode; tone: 'blue' | 'indigo' | 'emerald' | 'amber' | 'red' }) {
  const tones: Record<typeof tone, string> = {
    blue:    'bg-blue-50 text-blue-700 border-blue-100',
    indigo:  'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber:   'bg-amber-50 text-amber-700 border-amber-100',
    red:     'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <div className={`border rounded-lg p-4 ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wide font-semibold opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function RatingBars({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const max   = Math.max(...Object.values(distribution), 1);
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map(s => {
        const count = distribution[String(s)] ?? 0;
        const pctOfMax = Math.round((count / max) * 100);
        const pctOfTotal = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = s >= 4 ? 'bg-emerald-500' : s === 3 ? 'bg-amber-500' : 'bg-red-500';
        return (
          <div key={s} className="flex items-center gap-3 text-xs">
            <span className="w-10 text-right text-gray-700 font-medium">{s} ★</span>
            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
              <div className={`h-full ${color} transition-all`}
                   style={{ width: `${pctOfMax}%` }} />
            </div>
            <span className="w-24 text-gray-700 tabular-nums">
              {count} <span className="text-gray-400">({pctOfTotal}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: FeedbackRow }) {
  const stars = feedback.rating ?? 0;
  return (
    <li className="p-4 hover:bg-gray-50">
      <div className="flex items-start gap-4">
        {/* Star + ref */}
        <div className="flex-shrink-0 w-28">
          <div className="text-amber-500 text-lg leading-none">
            {'★'.repeat(stars)}<span className="text-gray-200">{'★'.repeat(5 - stars)}</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wide font-semibold">
            {feedback.submittedOn
              ? new Date(feedback.submittedOn).toLocaleString()
              : '—'}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {feedback.comment && (
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {feedback.comment}
            </p>
          )}
          {!feedback.comment && (
            <p className="text-sm text-gray-400 italic">No comment</p>
          )}

          {/* Contact line */}
          {(feedback.contactName || feedback.contactEmail || feedback.contactPhone) && (
            <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              {feedback.contactName  && <span>👤 {feedback.contactName}</span>}
              {feedback.contactEmail && <span>✉ {feedback.contactEmail}</span>}
              {feedback.contactPhone && <span>☎ {feedback.contactPhone}</span>}
            </div>
          )}

          {/* Photo strip */}
          {feedback.imageUrls && feedback.imageUrls.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {feedback.imageUrls.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="Feedback photo"
                       className="w-16 h-16 object-cover rounded border border-gray-200
                                  hover:border-blue-400 transition-colors" />
                </a>
              ))}
            </div>
          )}

          {/* Triage chips */}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
            {feedback.externalReferenceID && (
              <span>Ref: <code className="bg-gray-100 px-1 rounded text-gray-600">{feedback.externalReferenceID}</code></span>
            )}
            {feedback.feedbackID && (
              <span>ID: <code className="bg-gray-100 px-1 rounded text-gray-600 break-all">{feedback.feedbackID}</code></span>
            )}
            {feedback.ipAddress && <span>IP: {feedback.ipAddress}</span>}
          </div>
        </div>
      </div>
    </li>
  );
}
