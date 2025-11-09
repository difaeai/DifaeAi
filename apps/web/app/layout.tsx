import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { DefaultSeo } from 'next-seo';
import { ReactNode } from 'react';
import { colors } from '@difae/ui';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://difae.ai'),
  title: 'DIFAE AI — Proactive Security Cloud',
  description:
    'DIFAE transforms CCTV into a proactive AI security network that triages incidents in real-time.',
  openGraph: {
    title: 'DIFAE AI — Proactive Security Cloud',
    description:
      'DIFAE transforms CCTV into a proactive AI security network that triages incidents in real-time.',
    url: 'https://difae.ai',
    siteName: 'DIFAE AI',
    images: [
      {
        url: '/media/dashboard-mock.svg',
        width: 1200,
        height: 630,
        alt: 'DIFAE AI dashboard preview'
      }
    ]
  }
};

const defaultSeo = {
  title: 'DIFAE AI',
  description:
    'Proactive security cloud that turns CCTV into an intelligent incident response network.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    site_name: 'DIFAE AI'
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
