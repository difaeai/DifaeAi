'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@difae/ui';

const formSchema = z.object({
  email: z.string().email('Enter a valid email')
});

type FormValues = z.infer<typeof formSchema>;

export default function ResetPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  const onSubmit = form.handleSubmit(() => {
    setStatus('sent');
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-white/60">We’ll email reset instructions.</p>
      </div>
      {status === 'sent' ? (
        <p className="rounded-xl bg-green-500/20 p-3 text-sm text-green-200">
          Check your inbox for a reset link.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Email</label>
          <Input type="email" placeholder="you@company.com" {...form.register('email')} />
          {form.formState.errors.email ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
      <div className="text-center text-sm text-white/50">
        <Link href="/auth/sign-in" className="text-[#22D3EE]">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
