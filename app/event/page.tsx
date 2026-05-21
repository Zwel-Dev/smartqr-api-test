'use client';

import { useState, type ReactNode } from 'react';
import {
  RequestPanel, ResponsePanel,
  type RequestLog, type ResponseLog,
} from '@/app/components/io-panels';

interface EventResult {
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
  name:                'Q2 Sales Summit',
  description:         'APAC field sales annual gathering',
  externalReferenceID: 'SESSION-2026-Q2',

  // Event payload
  title:            'Q2 Sales Summit',
  subtitle:         'APAC region annual gathering',
  eventDescription: 'Two days of customer stories, product roadmap, and field training.',
  eventImageUrl:    '',
  category:         'Conference',

  startDate: '2026-06-15',
  startTime: '09:00',
  endDate:   '2026-06-16',
  endTime:   '17:00',

  isOnline:   false,
  onlineLink: '',

  location:   'Yangon Convention Centre',
  address:    'Pyay Road',
  city:       'Yangon',
  state:      'Yangon Region',
  postalCode: '11181',
  country:    'Myanmar',
  googleMapLink: '',
  website:    '',

  maxRegistrations: 200 as number | '',

  // Design
  selectedTemplate: 'template1',
  primaryColor:     '#196CD4',
  secondaryColor:   '#FF9800',

  // Registration
  showEmail:   true,  requireEmail:   true,
  showName:    true,  requireName:    true,
  showPhone:   false, requirePhone:   false,
  showCompany: true,  requireCompany: false,
  showPosition: false, requirePosition: false,
  showAdditionalInfo: false, requireAdditionalInfo: false,

  returnImage: false,
};

export default function EventPage() {
  // Envelope
  const [name, setName]                       = useState(DEFAULTS.name);
  const [description, setDescription]         = useState(DEFAULTS.description);
  const [externalReferenceID, setExternalRef] = useState(DEFAULTS.externalReferenceID);

  // Event — title / hero
  const [title, setTitle]                       = useState(DEFAULTS.title);
  const [subtitle, setSubtitle]                 = useState(DEFAULTS.subtitle);
  const [eventDescription, setEventDescription] = useState(DEFAULTS.eventDescription);
  const [eventImageUrl, setEventImageUrl]       = useState(DEFAULTS.eventImageUrl);
  const [category, setCategory]                 = useState(DEFAULTS.category);

  // Event — schedule
  const [startDate, setStartDate] = useState(DEFAULTS.startDate);
  const [startTime, setStartTime] = useState(DEFAULTS.startTime);
  const [endDate,   setEndDate]   = useState(DEFAULTS.endDate);
  const [endTime,   setEndTime]   = useState(DEFAULTS.endTime);

  // Event — hosting
  const [isOnline,   setIsOnline]   = useState(DEFAULTS.isOnline);
  const [onlineLink, setOnlineLink] = useState(DEFAULTS.onlineLink);

  // Event — location
  const [location,      setLocation]      = useState(DEFAULTS.location);
  const [address,       setAddress]       = useState(DEFAULTS.address);
  const [city,          setCity]          = useState(DEFAULTS.city);
  const [stateVal,      setStateVal]      = useState(DEFAULTS.state);
  const [postalCode,    setPostalCode]    = useState(DEFAULTS.postalCode);
  const [country,       setCountry]       = useState(DEFAULTS.country);
  const [googleMapLink, setGoogleMapLink] = useState(DEFAULTS.googleMapLink);
  const [website,       setWebsite]       = useState(DEFAULTS.website);

  // Event — capacity
  const [maxRegistrations, setMaxRegistrations] = useState<number | ''>(DEFAULTS.maxRegistrations);

  // Design
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULTS.selectedTemplate);
  const [primaryColor, setPrimaryColor]         = useState(DEFAULTS.primaryColor);
  const [secondaryColor, setSecondaryColor]     = useState(DEFAULTS.secondaryColor);

  // Registration toggles
  const [showEmail, setShowEmail]                       = useState(DEFAULTS.showEmail);
  const [requireEmail, setRequireEmail]                 = useState(DEFAULTS.requireEmail);
  const [showName, setShowName]                         = useState(DEFAULTS.showName);
  const [requireName, setRequireName]                   = useState(DEFAULTS.requireName);
  const [showPhone, setShowPhone]                       = useState(DEFAULTS.showPhone);
  const [requirePhone, setRequirePhone]                 = useState(DEFAULTS.requirePhone);
  const [showCompany, setShowCompany]                   = useState(DEFAULTS.showCompany);
  const [requireCompany, setRequireCompany]             = useState(DEFAULTS.requireCompany);
  const [showPosition, setShowPosition]                 = useState(DEFAULTS.showPosition);
  const [requirePosition, setRequirePosition]           = useState(DEFAULTS.requirePosition);
  const [showAdditionalInfo, setShowAdditionalInfo]     = useState(DEFAULTS.showAdditionalInfo);
  const [requireAdditionalInfo, setRequireAdditionalInfo] = useState(DEFAULTS.requireAdditionalInfo);

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
      event: {
        title:            title.trim(),
        subtitle:         subtitle.trim()         || undefined,
        eventDescription: eventDescription.trim() || undefined,
        eventImageUrl:    eventImageUrl.trim()    || undefined,
        category:         category.trim()         || undefined,

        startDate: startDate.trim(),
        startTime: startTime.trim() || undefined,
        endDate:   endDate.trim()   || undefined,
        endTime:   endTime.trim()   || undefined,

        isOnline,
        onlineLink: isOnline ? (onlineLink.trim() || undefined) : (onlineLink.trim() || undefined),

        location:      isOnline ? undefined : (location.trim()   || undefined),
        address:       isOnline ? undefined : (address.trim()    || undefined),
        city:          isOnline ? undefined : (city.trim()       || undefined),
        state:         isOnline ? undefined : (stateVal.trim()   || undefined),
        postalCode:    isOnline ? undefined : (postalCode.trim() || undefined),
        country:       isOnline ? undefined : (country.trim()    || undefined),
        googleMapLink: googleMapLink.trim() || undefined,
        website:       website.trim()       || undefined,

        maxRegistrations: typeof maxRegistrations === 'number' ? maxRegistrations : undefined,
      },
      design: {
        selectedTemplate: selectedTemplate.trim() || undefined,
        primaryColor:     primaryColor.trim()     || undefined,
        secondaryColor:   secondaryColor.trim()   || undefined,
      },
      registration: {
        showEmail,        requireEmail,
        showName,         requireName,
        showPhone,        requirePhone,
        showCompany,      requireCompany,
        showPosition,     requirePosition,
        showAdditionalInfo, requireAdditionalInfo,
      },
      returnImage,
    };

    const url = '/api/qr/event';
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
        body:       { status: 'error', code: 'NETWORK_ERROR', message } satisfies EventResult,
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
    setTitle(DEFAULTS.title);
    setSubtitle(DEFAULTS.subtitle);
    setEventDescription(DEFAULTS.eventDescription);
    setEventImageUrl(DEFAULTS.eventImageUrl);
    setCategory(DEFAULTS.category);
    setStartDate(DEFAULTS.startDate);
    setStartTime(DEFAULTS.startTime);
    setEndDate(DEFAULTS.endDate);
    setEndTime(DEFAULTS.endTime);
    setIsOnline(DEFAULTS.isOnline);
    setOnlineLink(DEFAULTS.onlineLink);
    setLocation(DEFAULTS.location);
    setAddress(DEFAULTS.address);
    setCity(DEFAULTS.city);
    setStateVal(DEFAULTS.state);
    setPostalCode(DEFAULTS.postalCode);
    setCountry(DEFAULTS.country);
    setGoogleMapLink(DEFAULTS.googleMapLink);
    setWebsite(DEFAULTS.website);
    setMaxRegistrations(DEFAULTS.maxRegistrations);
    setSelectedTemplate(DEFAULTS.selectedTemplate);
    setPrimaryColor(DEFAULTS.primaryColor);
    setSecondaryColor(DEFAULTS.secondaryColor);
    setShowEmail(DEFAULTS.showEmail);
    setRequireEmail(DEFAULTS.requireEmail);
    setShowName(DEFAULTS.showName);
    setRequireName(DEFAULTS.requireName);
    setShowPhone(DEFAULTS.showPhone);
    setRequirePhone(DEFAULTS.requirePhone);
    setShowCompany(DEFAULTS.showCompany);
    setRequireCompany(DEFAULTS.requireCompany);
    setShowPosition(DEFAULTS.showPosition);
    setRequirePosition(DEFAULTS.requirePosition);
    setShowAdditionalInfo(DEFAULTS.showAdditionalInfo);
    setRequireAdditionalInfo(DEFAULTS.requireAdditionalInfo);
    setReturnImage(DEFAULTS.returnImage);
    setRequest(null);
    setResponse(null);
  }

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event QR — Single create</h1>
        <p className="text-gray-500 text-sm mt-1">
          POST <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/public/qr/event</code> via
          a Next.js server function that keeps the API key on the server.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        {/* ── Form column ──────────────────────────────── */}
        <form onSubmit={submit}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">

          <Section title="Request metadata"
                   subtitle="Dashboard label, notes, your own ID mapping">
            <Grid>
              <Field label="Name">
                <input value={name} onChange={e => setName(e.target.value)}
                       className={inputClass} placeholder="Q2 Sales Summit" maxLength={200} />
              </Field>
              <Field label="External Reference ID">
                <input value={externalReferenceID} onChange={e => setExternalRef(e.target.value)}
                       className={inputClass} placeholder="SESSION-2026-Q2" maxLength={100} />
              </Field>
              <Field label="Description" full>
                <input value={description} onChange={e => setDescription(e.target.value)}
                       className={inputClass} placeholder="Short internal note" maxLength={500} />
              </Field>
            </Grid>
          </Section>

          <Section title="Event — title & hero" subtitle="Title required; image URL must be public http/https">
            <Grid>
              <Field label="Title *" full>
                <input value={title} onChange={e => setTitle(e.target.value)}
                       className={inputClass} required placeholder="Q2 Sales Summit" maxLength={200} />
              </Field>
              <Field label="Subtitle" full>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                       className={inputClass} placeholder="APAC region annual gathering" maxLength={200} />
              </Field>
              <Field label="Event description" full>
                <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)}
                          className={inputClass + ' h-20'} placeholder="Two days of …" maxLength={5000} />
              </Field>
              <Field label="Hero image URL" full>
                <input value={eventImageUrl} onChange={e => setEventImageUrl(e.target.value)}
                       className={inputClass} type="url" placeholder="https://cdn.example.com/events/hero.jpg" />
              </Field>
              <Field label="Category" full>
                <input value={category} onChange={e => setCategory(e.target.value)}
                       className={inputClass} placeholder="Conference / Workshop / Webinar" maxLength={100} />
              </Field>
            </Grid>
          </Section>

          <Section title="Schedule" subtitle="Times are HH:mm 24-hour. End must be ≥ start.">
            <Grid>
              <Field label="Start date *">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                       className={inputClass} required />
              </Field>
              <Field label="Start time">
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                       className={inputClass} />
              </Field>
              <Field label="End date">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                       className={inputClass} />
              </Field>
              <Field label="End time">
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                       className={inputClass} />
              </Field>
            </Grid>
          </Section>

          <Section title="Hosting & location"
                   subtitle="Toggle online to switch between in-person and virtual fields">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-3">
              <input type="checkbox" checked={isOnline}
                     onChange={e => setIsOnline(e.target.checked)}
                     className="accent-blue-600 w-4 h-4" />
              Online / hybrid event (<code>isOnline: true</code>)
            </label>

            {isOnline ? (
              <Grid>
                <Field label="Online link *" hint="Required when online" full>
                  <input value={onlineLink} onChange={e => setOnlineLink(e.target.value)}
                         className={inputClass} type="url" required
                         placeholder="https://zoom.us/j/123456789" />
                </Field>
                <Field label="Event website" full>
                  <input value={website} onChange={e => setWebsite(e.target.value)}
                         className={inputClass} type="url" placeholder="https://example.com/events/…" />
                </Field>
              </Grid>
            ) : (
              <Grid>
                <Field label="Venue name" full>
                  <input value={location} onChange={e => setLocation(e.target.value)}
                         className={inputClass} placeholder="Yangon Convention Centre" />
                </Field>
                <Field label="Address" full>
                  <input value={address} onChange={e => setAddress(e.target.value)}
                         className={inputClass} placeholder="Pyay Road" />
                </Field>
                <Field label="City">
                  <input value={city} onChange={e => setCity(e.target.value)}
                         className={inputClass} placeholder="Yangon" />
                </Field>
                <Field label="State / Region">
                  <input value={stateVal} onChange={e => setStateVal(e.target.value)}
                         className={inputClass} placeholder="Yangon Region" />
                </Field>
                <Field label="Postal code">
                  <input value={postalCode} onChange={e => setPostalCode(e.target.value)}
                         className={inputClass} placeholder="11181" />
                </Field>
                <Field label="Country">
                  <input value={country} onChange={e => setCountry(e.target.value)}
                         className={inputClass} placeholder="Myanmar" />
                </Field>
                <Field label="Google Maps link" full>
                  <input value={googleMapLink} onChange={e => setGoogleMapLink(e.target.value)}
                         className={inputClass} type="url"
                         placeholder="https://maps.google.com/?q=…" />
                </Field>
                <Field label="Event website" full>
                  <input value={website} onChange={e => setWebsite(e.target.value)}
                         className={inputClass} type="url" placeholder="https://example.com/events/…" />
                </Field>
              </Grid>
            )}
          </Section>

          <Section title="Capacity">
            <Field label="Max registrations" hint="Leave blank for unlimited">
              <input type="number" min={0}
                     value={maxRegistrations}
                     onChange={e => setMaxRegistrations(e.target.value === '' ? '' : Number(e.target.value))}
                     className={inputClass} placeholder="200" />
            </Field>
          </Section>

          <Section title="Branding" subtitle="Hex must be #RRGGBB">
            <Grid>
              <Field label="Template">
                <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                        className={inputClass}>
                  <option value="template1">template1</option>
                  <option value="template2">template2</option>
                  <option value="template3">template3</option>
                </select>
              </Field>
              <Field label="Primary color">
                <div className="flex gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                         className="w-10 h-10 border border-gray-300 rounded" />
                  <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                         className={inputClass} placeholder="#196CD4" />
                </div>
              </Field>
              <Field label="Secondary color">
                <div className="flex gap-2">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                         className="w-10 h-10 border border-gray-300 rounded" />
                  <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                         className={inputClass} placeholder="#FF9800" />
                </div>
              </Field>
            </Grid>
          </Section>

          <Section title="Registration form"
                   subtitle="Standard fields shown on the landing page. Each has independent Show / Require flags.">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-wide text-gray-600 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Field</th>
                    <th className="px-3 py-2 text-center font-medium">Show</th>
                    <th className="px-3 py-2 text-center font-medium">Require</th>
                  </tr>
                </thead>
                <tbody>
                  <RegRow label="Email"
                          show={showEmail} setShow={setShowEmail}
                          req={requireEmail} setReq={setRequireEmail} />
                  <RegRow label="Name"
                          show={showName} setShow={setShowName}
                          req={requireName} setReq={setRequireName} />
                  <RegRow label="Phone"
                          show={showPhone} setShow={setShowPhone}
                          req={requirePhone} setReq={setRequirePhone} />
                  <RegRow label="Company"
                          show={showCompany} setShow={setShowCompany}
                          req={requireCompany} setReq={setRequireCompany} />
                  <RegRow label="Position"
                          show={showPosition} setShow={setShowPosition}
                          req={requirePosition} setReq={setRequirePosition} />
                  <RegRow label="Additional info"
                          show={showAdditionalInfo} setShow={setShowAdditionalInfo}
                          req={requireAdditionalInfo} setReq={setRequireAdditionalInfo} />
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-500 mt-3">
              Custom fields (select dropdowns, free-text, etc.) aren't editable from this form — use the Bulk
              page or the raw JSON tester if you need them.
            </p>
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
            <button type="submit" disabled={loading || !title.trim() || !startDate.trim()}
                    className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               text-white text-sm font-medium">
              {loading ? 'Creating…' : 'Create Event QR'}
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
// Layout helpers (kept in lock-step with the VCard/Website pages)
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

function RegRow({ label, show, setShow, req, setReq }:
  { label: string; show: boolean; setShow: (v: boolean) => void;
    req: boolean; setReq: (v: boolean) => void }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2 text-gray-700">{label}</td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)}
               className="accent-blue-600 w-4 h-4" />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={req} onChange={e => setReq(e.target.checked)}
               disabled={!show}
               className="accent-blue-600 w-4 h-4 disabled:opacity-30" />
      </td>
    </tr>
  );
}

/** Compact, human-readable highlights from a typical Smart_QR event response. */
function renderHighlights(body: unknown): ReactNode {
  if (!body || typeof body !== 'object') return null;
  const r = body as EventResult;

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
