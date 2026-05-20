'use client';

import { useState, type ReactNode } from 'react';

export interface RequestLog {
  method: string;
  url: string;
  body: unknown;
  sentAt: string;
}

export interface ResponseLog {
  status: number;
  statusText: string;
  ok: boolean;
  body: unknown;
  durationMs: number;
}

export function RequestPanel({ request }: { request: RequestLog | null }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <header className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">Request</span>
          {request && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                             bg-blue-100 text-blue-700 tracking-wide">
              {request.method}
            </span>
          )}
        </div>
        {request && <CopyButton text={JSON.stringify(request.body, null, 2)} />}
      </header>
      {!request && (
        <div className="px-4 py-8 text-center text-xs text-gray-400">
          Submit to see the request payload.
        </div>
      )}
      {request && (
        <div className="text-xs">
          <div className="px-4 py-2 border-b border-gray-100 font-mono text-gray-700 break-all">
            {request.url}
          </div>
          <pre className="px-4 py-3 bg-gray-900 text-gray-100 font-mono text-[11px] leading-relaxed
                          overflow-auto max-h-80">
{JSON.stringify(request.body, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}

export function ResponsePanel({
  response, loading, highlights,
}: {
  response: ResponseLog | null;
  loading: boolean;
  /** Optional compact "highlights" row above the raw JSON, page-specific. */
  highlights?: (body: unknown) => ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <header className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">Response</span>
          {response && <StatusBadge status={response.status} statusText={response.statusText} />}
        </div>
        {response && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-gray-500 font-mono">{response.durationMs} ms</span>
            <CopyButton text={JSON.stringify(response.body, null, 2)} />
          </div>
        )}
      </header>

      {loading && (
        <div className="px-4 py-8 text-center text-xs text-gray-500">
          <span className="inline-block w-3 h-3 mr-2 border-2 border-gray-300 border-t-blue-600
                           rounded-full animate-spin align-[-2px]" />
          Waiting for response…
        </div>
      )}

      {!loading && !response && (
        <div className="px-4 py-8 text-center text-xs text-gray-400">
          No response yet.
        </div>
      )}

      {!loading && response && (
        <>
          {highlights?.(response.body)}
          <pre className="px-4 py-3 bg-gray-900 text-gray-100 font-mono text-[11px] leading-relaxed
                          overflow-auto max-h-96">
{JSON.stringify(response.body, null, 2)}
          </pre>
        </>
      )}
    </section>
  );
}

export function StatusBadge({ status, statusText }: { status: number; statusText: string }) {
  const cat =
    status === 0      ? { bg: 'bg-red-100',     fg: 'text-red-700',     dot: 'bg-red-500'     }
    : status >= 500   ? { bg: 'bg-red-100',     fg: 'text-red-700',     dot: 'bg-red-500'     }
    : status >= 400   ? { bg: 'bg-amber-100',   fg: 'text-amber-800',   dot: 'bg-amber-500'   }
    : status >= 300   ? { bg: 'bg-blue-100',    fg: 'text-blue-700',    dot: 'bg-blue-500'    }
    : status >= 200   ? { bg: 'bg-emerald-100', fg: 'text-emerald-700', dot: 'bg-emerald-500' }
    :                   { bg: 'bg-gray-100',    fg: 'text-gray-700',    dot: 'bg-gray-400'    };

  const label = status === 0 ? 'Network error' : statusText || httpReason(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px]
                      font-semibold ${cat.bg} ${cat.fg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
      {status === 0 ? '—' : status} {label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch { /* clipboard may be blocked — fail quietly */ }
      }}
      className="text-[11px] px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-600
                 hover:bg-gray-50 hover:text-gray-900 transition-colors">
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function httpReason(status: number): string {
  if (status >= 500) return 'Server Error';
  if (status >= 400) return 'Client Error';
  if (status >= 300) return 'Redirect';
  if (status >= 200) return 'OK';
  return '';
}
