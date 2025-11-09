'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Button, Input, Textarea } from '@difae/ui';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Tell us how we can help')
});

type FormValues = z.infer<typeof formSchema>;

export default function SupportPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  const onSubmit = form.handleSubmit(() => {
    setStatus('sent');
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1 gap-10">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold">Support & contact</h1>
          <p className="max-w-2xl text-white/70">
            Submit a ticket and the DIFAE support desk will follow up within two business hours.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Name</label>
            <Input placeholder="Your name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="mt-2 text-xs text-red-300">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Email</label>
            <Input placeholder="you@company.com" type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="mt-2 text-xs text-red-300">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Message</label>
            <Textarea rows={5} placeholder="How can we help?" {...form.register('message')} />
            {form.formState.errors.message ? (
              <p className="mt-2 text-xs text-red-300">{form.formState.errors.message.message}</p>
            ) : null}
          </div>
          <Button type="submit" size="lg">
            {status === 'sent' ? 'Ticket submitted' : 'Send ticket'}
          </Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
