'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@difae/ui';

const formSchema = z.object({
  company: z.string().min(2, 'Company is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters')
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const onSubmit = form.handleSubmit(() => {
    setStatus('success');
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-white/60">Start a proactive security trial in minutes.</p>
      </div>
      {status === 'success' ? (
        <p className="rounded-xl bg-green-500/20 p-3 text-sm text-green-200">
          Account placeholder created. Configure Firebase Auth to activate sign-up.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Company</label>
          <Input placeholder="Company name" {...form.register('company')} />
          {form.formState.errors.company ? (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.company.message}</p>
          ) : null}
        </div>
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
          Create account
        </Button>
      </form>
      <div className="text-center text-sm text-white/50">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="text-[#22D3EE]">
          Sign in
        </Link>
      </div>
    </div>
  );
}
