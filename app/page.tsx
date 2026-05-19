'use client';

import { useState, type ReactNode } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<VCardResult | null>(null);

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
    setResult(null);

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

    try {
      const res = await fetch('/api/qr/vcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setResult(await res.json());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setResult({ status: 'error', code: 'NETWORK_ERROR', message });
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
    setResult(null);
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Smart_QR Integration Demo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Frontend calls <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/qr/vcard</code>;
          a Next.js server function forwards to Smart_QR with the API key kept on the server.
        </p>
      </header>

      <form onSubmit={submit}
            className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">

        {/* ── Request metadata ─────────────────────────── */}
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

        {/* ── Contact ─────────────────────────────────── */}
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

        {/* ── Company ─────────────────────────────────── */}
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

        {/* ── Address ─────────────────────────────────── */}
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

        {/* ── Options ─────────────────────────────────── */}
        <Section title="Options">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={returnImage}
                   onChange={e => setReturnImage(e.target.checked)}
                   className="accent-blue-600 w-4 h-4" />
            Include base64 QR image in response (<code>returnImage: true</code>)
          </label>
        </Section>

        {/* ── Actions ─────────────────────────────────── */}
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

      {/* ── Result ─────────────────────────────────── */}
      {result && <ResultPanel result={result} />}
    </main>
  );
}

// ────────────────────────────────────────────────────────
// Layout helpers — tiny so the form file reads cleanly
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

function ResultPanel({ result }: { result: VCardResult }) {
  const isOk = !!result.qrCodeID;
  return (
    <section className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <header className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <h2 className="font-semibold text-sm text-gray-900">
          {isOk ? 'VCard created' : 'Request failed'}
        </h2>
      </header>
      <div className="p-5 space-y-3 text-sm">
        {isOk && (
          <>
            <Row label="QR Code ID"><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{result.qrCodeID}</code></Row>
            {result.externalReferenceID && (
              <Row label="External Ref"><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{result.externalReferenceID}</code></Row>
            )}
            {result.shortUrl && (
              <Row label="Short URL">
                <a href={result.shortUrl} target="_blank" rel="noreferrer"
                   className="text-blue-600 hover:underline break-all">{result.shortUrl}</a>
              </Row>
            )}
            {result.viewUrl && (
              <Row label="View URL">
                <a href={result.viewUrl} target="_blank" rel="noreferrer"
                   className="text-blue-600 hover:underline break-all">{result.viewUrl}</a>
              </Row>
            )}
            {result.expiresOn && <Row label="Expires"><span className="text-gray-700">{result.expiresOn}</span></Row>}
            {result.qrImageBase64 && (
              <div className="pt-2">
                <img src={result.qrImageBase64} alt="QR"
                     className="max-w-[220px] border border-gray-200 rounded-md bg-white p-2" />
              </div>
            )}
            {!result.qrImageBase64 && result.qrImageUrl && (
              <div className="pt-2">
                <img src={result.qrImageUrl} alt="QR"
                     className="max-w-[220px] border border-gray-200 rounded-md bg-white p-2" />
              </div>
            )}
          </>
        )}
        {!isOk && (
          <div className="text-red-700">
            <p><strong>{result.code || 'ERROR'}</strong>: {result.message || 'Unknown error'}</p>
            {result.field && <p className="text-xs mt-1 text-red-600">Field: <code>{result.field}</code></p>}
          </div>
        )}
        <details className="pt-3">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">Raw response</summary>
          <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto leading-relaxed">
{JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-24 flex-shrink-0">{label}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}
