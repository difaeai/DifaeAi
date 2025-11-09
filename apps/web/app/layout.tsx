import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { DefaultSeo } from 'next-seo';
import { ReactNode } from 'react';
import { colors } from '@difae/ui';

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
  }
};

const defaultSeo = {
  title: 'Proland',
  description:
    'The next-generation smartwatch that keeps you energised, protected, and connected wherever you go.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    site_name: 'Proland'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-[#060A15]">
      <body
        className={`${inter.variable} flex min-h-screen flex-col bg-gradient-to-b from-[#060A15] via-[#060A15] to-[#0B1220]`}
        style={{ color: colors.foreground }}
      >
        <DefaultSeo {...defaultSeo} />
        {children}
      </body>
    </html>
  );
}
