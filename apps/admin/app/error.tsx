'use client';

import { Button } from '@difae/ui';

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05070F] text-white">
      <h1 className="text-3xl font-semibold">Admin area error</h1>
      <p className="mt-2 text-white/60">Retry or contact platform engineering.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
