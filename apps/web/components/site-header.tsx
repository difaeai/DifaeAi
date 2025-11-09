'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@difae/ui';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/features', label: 'Features' },
  { href: '/cameras', label: 'Cameras' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/support', label: 'Support' }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#060A15]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22D3EE]/20 text-[#22D3EE]">
            DA
          </span>
          DIFAE AI
        </Link>
        <nav className="hidden items-center gap-10 text-sm font-medium text-white/70 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/auth/sign-in" className="text-sm text-white/70 transition hover:text-white">
            Sign in
          </Link>
          <Button asChild>
            <Link href="/pricing">Explore plans</Link>
          </Button>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/5 bg-[#060A15]/95 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild>
              <Link href="/pricing">Explore plans</Link>
            </Button>
            <Link href="/auth/sign-in" className="text-white/70" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
