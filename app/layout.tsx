import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/app/components/sidebar';

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
        <Sidebar />
        <div className="lg:pl-64">
          {children}
        </div>
      </body>
    </html>
  );
}
