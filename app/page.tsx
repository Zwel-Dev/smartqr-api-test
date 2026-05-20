'use client';

import { useState, type ReactNode } from 'react';
import {
  RequestPanel, ResponsePanel,
  type RequestLog, type ResponseLog,
} from '@/app/components/io-panels';

interface VCardResult {
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
  name:                'John Doe – Sales',
  externalReferenceID: 'EMP-1234',
  fullName:            'John Doe',
  phone:               '+95-9-123-456-789',
  altPhone:            '+95-1-555-1001',
  email:               'john.doe@example.com',
  website:             'https://example.com',
  companyName:         'Example Co.',
  companyTitle:        'Senior Sales Lead',
  summaryText:         'Reach me anytime.',
  street:              '123 Main Rd',
  postalCode:          '11181',
  city:                'Yangon',
  state:               'Yangon Region',
  country:             'Myanmar',
  returnImage:         false,
};

export default function Home() {
  // Request metadata
  const [name, setName]                       = useState(DEFAULTS.name);
  const [externalReferenceID, setExternalRef] = useState(DEFAULTS.externalReferenceID);

  // VCard — contact
  const [fullName, setFullName] = useState(DEFAULTS.fullName);
  const [phone,    setPhone]    = useState(DEFAULTS.phone);
  const [altPhone, setAltPhone] = useState(DEFAULTS.altPhone);
  const [email,    setEmail]    = useState(DEFAULTS.email);
  const [website,  setWebsite]  = useState(DEFAULTS.website);

  // VCard — company
  const [companyName,  setCompanyName]  = useState(DEFAULTS.companyName);
  const [companyTitle, setCompanyTitle] = useState(DEFAULTS.companyTitle);
  const [summaryText,  setSummaryText]  = useState(DEFAULTS.summaryText);

  // VCard — address
  const [street,     setStreet]     = useState(DEFAULTS.street);
  const [postalCode, setPostalCode] = useState(DEFAULTS.postalCode);
  const [city,       setCity]       = useState(DEFAULTS.city);
  const [stateVal,   setStateVal]   = useState(DEFAULTS.state);
  const [country,    setCountry]    = useState(DEFAULTS.country);

  // Options
  const [returnImage, setReturnImage] = useState(DEFAULTS.returnImage);

  // UI state
  const [loading, setLoading]   = useState(false);
  const [request, setRequest]   = useState<RequestLog | null>(null);
  const [response, setResponse] = useState<ResponseLog | null>(null);

  /** Build the address object only if at least one field is filled — keeps the payload tidy. */
  function buildAddress() {
    const trimmed = {
      street:     street.trim(),
      postalCode: postalCode.trim(),
      city:       city.trim(),
      state:      stateVal.trim(),
      country:    country.trim(),
    };
    const anySet = Object.values(trimmed).some(v => v.length > 0);
    if (!anySet) return undefined;
    return {
      street:     trimmed.street     || undefined,
      postalCode: trimmed.postalCode || undefined,
      city:       trimmed.city       || undefined,
      state:      trimmed.state      || undefined,
      country:    trimmed.country    || undefined,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    const payload = {
      name:                name.trim()                || undefined,
      externalReferenceID: externalReferenceID.trim() || undefined,
      vcard: {
        fullName:     fullName.trim(),
        phone:        phone.trim()        || undefined,
        altPhone:     altPhone.trim()     || undefined,
        email:        email.trim()        || undefined,
        website:      website.trim()      || undefined,
        companyName:  companyName.trim()  || undefined,
        companyTitle: companyTitle.trim() || undefined,
        summaryText:  summaryText.trim()  || undefined,
        address:      buildAddress(),
      },
      returnImage,
    };

    const url = '/api/qr/vcard';
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
        body:       { status: 'error', code: 'NETWORK_ERROR', message } satisfies VCardResult,
        durationMs: Math.round(performance.now() - start),
      });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName(DEFAULTS.name);
    setExternalRef(DEFAULTS.externalReferenceID);
    setFullName(DEFAULTS.fullName);
    setPhone(DEFAULTS.phone);
    setAltPhone(DEFAULTS.altPhone);
    setEmail(DEFAULTS.email);
    setWebsite(DEFAULTS.website);
    setCompanyName(DEFAULTS.companyName);
    setCompanyTitle(DEFAULTS.companyTitle);
    setSummaryText(DEFAULTS.summaryText);
    setStreet(DEFAULTS.street);
    setPostalCode(DEFAULTS.postalCode);
    setCity(DEFAULTS.city);
    setStateVal(DEFAULTS.state);
    setCountry(DEFAULTS.country);
    setReturnImage(DEFAULTS.returnImage);
    setRequest(null);
    setResponse(null);
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Smart_QR Integration Demo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Frontend calls <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/qr/vcard</code>;
          a Next.js server function forwards to Smart_QR with the API key kept on the server.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        {/* ── Form column ──────────────────────────────── */}
        <form onSubmit={submit}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">

          <Section title="Request metadata"
                   subtitle="Optional dashboard label + your own ID mapping">
            <Grid>
              <Field label="Name" hint="Shown in your Smart_QR dashboard">
                <input value={name} onChange={e => setName(e.target.value)}
                       className={inputClass} placeholder="John Doe – Sales" />
              </Field>
              <Field label="External Reference ID" hint="Your own ID (e.g. EMP-1234)">
                <input value={externalReferenceID} onChange={e => setExternalRef(e.target.value)}
                       className={inputClass} placeholder="EMP-1234" maxLength={100} />
              </Field>
            </Grid>
          </Section>

          <Section title="Contact"
                   subtitle="Full name required; at least one of phone or email">
            <Grid>
              <Field label="Full name *" full>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                       className={inputClass} required placeholder="John Doe" />
              </Field>
              <Field label="Phone">
                <input value={phone} onChange={e => setPhone(e.target.value)}
                       className={inputClass} placeholder="+95-9-123-456-789" />
              </Field>
              <Field label="Alt phone">
                <input value={altPhone} onChange={e => setAltPhone(e.target.value)}
                       className={inputClass} placeholder="+95-1-555-1001" />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                       className={inputClass} placeholder="john@example.com" />
              </Field>
              <Field label="Website">
                <input value={website} onChange={e => setWebsite(e.target.value)}
                       className={inputClass} placeholder="https://example.com" />
              </Field>
            </Grid>
          </Section>

          <Section title="Company" subtitle="All optional">
            <Grid>
              <Field label="Company name">
                <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                       className={inputClass} placeholder="Example Co." />
              </Field>
              <Field label="Title">
                <input value={companyTitle} onChange={e => setCompanyTitle(e.target.value)}
                       className={inputClass} placeholder="Senior Sales Lead" />
              </Field>
              <Field label="Summary text" full>
                <input value={summaryText} onChange={e => setSummaryText(e.target.value)}
                       className={inputClass} placeholder="Reach me anytime." />
              </Field>
            </Grid>
          </Section>

          <Section title="Address" subtitle="All optional — empty fields are omitted">
            <Grid>
              <Field label="Street" full>
                <input value={street} onChange={e => setStreet(e.target.value)}
                       className={inputClass} placeholder="123 Main Rd" />
              </Field>
              <Field label="Postal code">
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)}
                       className={inputClass} placeholder="11181" />
              </Field>
              <Field label="City">
                <input value={city} onChange={e => setCity(e.target.value)}
                       className={inputClass} placeholder="Yangon" />
              </Field>
              <Field label="State / Region">
                <input value={stateVal} onChange={e => setStateVal(e.target.value)}
                       className={inputClass} placeholder="Yangon Region" />
              </Field>
              <Field label="Country">
                <input value={country} onChange={e => setCountry(e.target.value)}
                       className={inputClass} placeholder="Myanmar" />
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
            <button type="submit" disabled={loading || !fullName.trim()}
                    className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               text-white text-sm font-medium">
              {loading ? 'Creating…' : 'Create VCard'}
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

/** Compact, human-readable highlights from a typical Smart_QR response. */
function renderHighlights(body: unknown): ReactNode {
  if (!body || typeof body !== 'object') return null;
  const r = body as VCardResult;

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
