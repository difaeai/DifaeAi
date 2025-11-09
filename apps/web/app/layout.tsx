import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

const SITE_URL = 'https://difae.ai';
const SOCIAL_IMAGE_PATH = '/proland/watch-hero.svg';
const SEO_TITLE = 'Proland — The future of wearable tech';
const SEO_DESCRIPTION =
  'Explore Proland, the smart wearable crafted for wellness, productivity, and safety with adaptive intelligence.';

const metadataBase = new URL(SITE_URL);
const openGraphImage = {
  url: SOCIAL_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: 'Proland smartwatch hero image'
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase,
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Proland',
    images: [openGraphImage]
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [SOCIAL_IMAGE_PATH]
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
