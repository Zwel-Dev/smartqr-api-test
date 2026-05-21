'use client';

import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import vcardIcon   from '@/app/assets/vcard-qr.svg';
import websiteIcon from '@/app/assets/website-qr.svg';
import eventIcon   from '@/app/assets/Event-icon.png';

interface NavItem {
  href: string;
  label: string;
}

interface NavSection {
  label: string;
  icon: StaticImageData;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: 'VCard',
    icon: vcardIcon,
    items: [
      { href: '/',     label: 'Single VCard' },
      { href: '/bulk', label: 'Bulk VCard'   },
    ],
  },
  {
    label: 'Website',
    icon: websiteIcon,
    items: [
      { href: '/website',      label: 'Single Website' },
      { href: '/website-bulk', label: 'Bulk Website'   },
    ],
  },
  {
    label: 'Event',
    icon: eventIcon,
    items: [
      { href: '/event',      label: 'Single Event' },
      { href: '/event-bulk', label: 'Bulk Event'   },
    ],
  },
];

export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top bar (hamburger + brand) ───────── */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200
                         px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation"
          className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100">
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z" />
          </svg>
        </button>
        <Brand />
      </header>

      {/* ── Mobile backdrop ──────────────────────────── */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside
        className={
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 ' +
          'flex flex-col transform transition-transform duration-200 ease-out ' +
          'lg:translate-x-0 ' +
          (open ? 'translate-x-0' : '-translate-x-full')
        }>
        <div className="px-5 py-4 border-b border-gray-200">
          <Brand />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {SECTIONS.map(section => {
            const hasActive = section.items.some(i => i.href === path);
            return (
              <div key={section.label}>
                <div className="flex items-center gap-2 px-2 mb-2">
                  <span className={
                    'inline-flex items-center justify-center w-6 h-6 rounded ' +
                    (hasActive ? 'bg-blue-50' : 'bg-gray-50')
                  }>
                    <Image src={section.icon} alt="" width={18} height={18} className="w-[18px] h-[18px]" />
                  </span>
                  <span className={
                    'text-[11px] font-semibold uppercase tracking-wider ' +
                    (hasActive ? 'text-blue-700' : 'text-gray-500')
                  }>
                    {section.label}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {section.items.map(item => {
                    const active = path === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={
                            'flex items-center gap-2.5 ml-2 pl-3 pr-3 py-2 rounded-md ' +
                            'text-sm font-medium transition-colors ' +
                            (active
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                          }>
                          <span className={
                            'w-1.5 h-1.5 rounded-full flex-shrink-0 ' +
                            (active ? 'bg-blue-600' : 'bg-gray-300')
                          } />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="px-5 py-3 border-t border-gray-200 text-[11px] text-gray-400">
          SmartQR Demo
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 text-gray-900 font-semibold">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md
                       bg-blue-600 text-white text-xs font-bold">
        QR
      </span>
      <span className="text-sm">SmartQR API Tester</span>
    </Link>
  );
}

