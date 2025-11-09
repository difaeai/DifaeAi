import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://difae.ai'),
  title: 'Proland — The future of wearable tech',
  description:
    'Explore Proland, the smart wearable crafted for wellness, productivity, and safety with adaptive intelligence.',
  openGraph: {
    title: 'Proland — The future of wearable tech',
    description:
      'Explore Proland, the smart wearable crafted for wellness, productivity, and safety with adaptive intelligence.',
    url: 'https://difae.ai',
    siteName: 'Proland',
    images: [
      {
        url: '/proland/watch-hero.svg',
        width: 1200,
        height: 630,
        alt: 'Proland smartwatch hero image'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proland — The future of wearable tech',
    description:
      'Explore Proland, the smart wearable crafted for wellness, productivity, and safety with adaptive intelligence.',
    images: ['/proland/watch-hero.svg']
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-[#060A15]">
      <body className={`${inter.variable} flex min-h-screen flex-col bg-gradient-to-b from-[#060A15] via-[#060A15] to-[#0B1220] text-white`}>
        {children}
      </body>
    </html>
  );
}
