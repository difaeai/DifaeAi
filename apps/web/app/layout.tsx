import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

const SITE_URL = 'https://difae.ai';
const SOCIAL_IMAGE = '/proland/watch-hero.svg';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Proland — The future of wearable tech',
  description:
    'Explore Proland, the smart wearable crafted for wellness, productivity, and safety with adaptive intelligence.',
  openGraph: {
    title: 'Proland — The future of wearable tech',
    description:
      'Explore Proland, the smart wearable crafted for wellness, productivity, and safety with adaptive intelligence.',
    url: SITE_URL,
    siteName: 'Proland',
    images: [
      {
        url: SOCIAL_IMAGE,
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
    images: [SOCIAL_IMAGE]
  }
};

const bodyClassName = [
  inter.variable,
  'flex min-h-screen flex-col bg-gradient-to-b from-[#060A15] via-[#060A15] to-[#0B1220] text-white'
].join(' ');

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-[#060A15]">
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
