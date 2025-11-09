'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@difae/ui';

const formSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(() => {
    setError('Firebase Auth is not configured in this preview. Add env keys to enable.');
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-white/60">Sign in to access your DIFAE dashboard.</p>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Email</label>
          <Input type="email" placeholder="you@company.com" {...form.register('email')} />
          {form.formState.errors.email ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Password</label>
          <Input type="password" placeholder="••••••••" {...form.register('password')} />
          {form.formState.errors.password ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
      <div className="text-center text-sm text-white/60">
        <Link href="/auth/reset" className="text-[#22D3EE]">
          Forgot password?
        </Link>
      </div>
      <div className="text-center text-sm text-white/50">
        Need an account?{' '}
        <Link href="/auth/sign-up" className="text-[#22D3EE]">
          Create one
        </Link>
      </div>
    </div>
  );
}
