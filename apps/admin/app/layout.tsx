import './globals.css';

import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'DIFAE Admin',
  description: 'Manage DIFAE content and operations.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#05070F] text-white antialiased">{children}</body>
    </html>
  );
}
