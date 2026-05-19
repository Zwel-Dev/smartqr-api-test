import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/app/components/top-nav';

export const metadata: Metadata = {
  title: 'Smart_QR Integration Demo',
  description: 'Next.js + Vercel reference integration for Smart_QR',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900 antialiased">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
