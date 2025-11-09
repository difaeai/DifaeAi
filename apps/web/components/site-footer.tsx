import Link from 'next/link';

const columns = [
  {
    title: 'Explore',
    links: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About Us' },
      { href: '/difae-agent', label: 'DIFAE AI Agent' }
    ]
  },
  {
    title: 'Solutions',
    links: [
      { href: '/products', label: 'Products' },
      { href: '/contact', label: 'Contact Us' },
      { href: '/auth/sign-in', label: 'Customer Login' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#05070F]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm text-sm text-white/60">
            <div className="text-lg font-semibold text-white">DIFAE AI</div>
            <p className="mt-4">
              Proactive Security Cloud protecting physical assets with machine vision, threat
              classification, and AI-driven response workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title} className="space-y-4 text-sm">
                <div className="text-sm font-semibold text-white/70">{column.title}</div>
                <ul className="space-y-2 text-white/50">
                  {column.links.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="transition hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/5 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} DIFAE AI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white">
              LinkedIn
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white">
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
