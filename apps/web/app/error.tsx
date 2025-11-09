'use client';

import { Button } from '@difae/ui';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#05070F] text-center text-white">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="text-white/70">Reload the page or return home while we investigate.</p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
