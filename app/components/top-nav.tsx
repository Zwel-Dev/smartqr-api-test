'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',              label: 'Single VCard' },
  { href: '/bulk',          label: 'Bulk VCard' },
  { href: '/website',       label: 'Single Website' },
  { href: '/website-bulk',  label: 'Bulk Website' },
];

export function TopNav() {
  const path = usePathname();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-8 py-3 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-gray-900 font-semibold">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded
                           bg-blue-600 text-white text-xs font-bold">QR</span>
          Smart_QR Demo
        </Link>
        <nav className="flex gap-1">
          {TABS.map(t => {
            const active = path === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  'px-3 py-1.5 text-sm rounded-md font-medium transition-colors ' +
                  (active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
