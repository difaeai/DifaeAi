'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@difae/ui';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/users', label: 'Users' },
  { href: '/cameras', label: 'Cameras' },
  { href: '/incidents', label: 'Incidents' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/content', label: 'Content CMS' }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col gap-6 border-r border-white/10 bg-[#05070F]/80 px-6 py-10">
      <div className="text-lg font-semibold">DIFAE Admin</div>
      <nav className="flex flex-1 flex-col gap-2 text-sm text-white/60">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-xl px-3 py-2 transition',
              pathname === link.href ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
