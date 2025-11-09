import Link from 'next/link';
import { Button } from '@difae/ui';
import { SiteHeader } from '../components/site-header';
import { SiteFooter } from '../components/site-footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1 items-center text-center">
        <h1 className="text-5xl font-semibold">Page not found</h1>
        <p className="max-w-xl text-white/70">
          The page you’re looking for moved or no longer exists. Let’s get you back to safety.
        </p>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
