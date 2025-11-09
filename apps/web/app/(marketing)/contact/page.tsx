'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Input, Textarea } from '@difae/ui';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  company: z.string().min(2, 'Company or organisation is required'),
  message: z.string().min(10, 'Tell us how we can help')
});

type FormValues = z.infer<typeof formSchema>;

const contactChannels = [
  {
    title: 'Sales & demos',
    description: 'Book a walkthrough of DIFAE Agent, hardware, and deployment services tailored to your estate.',
    detail: 'sales@difae.ai'
  },
  {
    title: 'Support desk',
    description: 'Active customers can open 24/7 support tickets and receive updates within two hours.',
    detail: 'support@difae.ai'
  },
  {
    title: 'Head office',
    description: 'Suite 10B, NASTP Innovation Park, Karachi. Visits by appointment only for security clearance.',
    detail: '+92 21 3894 1122'
  }
];

export default function ContactPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  const onSubmit = form.handleSubmit(() => {
    setStatus('sent');
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#050815] text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="section-shell gap-12 pb-20 pt-24">
          <div className="flex flex-col gap-6 md:max-w-3xl">
            <Badge tone="accent" className="w-fit">Contact DIFAE</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Talk to our architects about modernising your security operations.
            </h1>
            <p className="text-lg text-white/70">
              Share a few details and we’ll connect you with a DIFAE specialist who understands your industry, compliance
              needs, and operational goals.
            </p>
          </div>
        </section>

        <section className="section-shell gap-10">
          <div className="grid gap-6 md:grid-cols-3">
            {contactChannels.map((channel) => (
              <Card key={channel.title} className="border-white/10 bg-white/[0.04]">
                <CardHeader>
                  <CardTitle>{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                  <p className="mt-4 text-sm text-white/70">{channel.detail}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
          <form
            onSubmit={onSubmit}
            className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 lg:grid-cols-2"
          >
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold">Send us a message</h2>
              <p className="mt-2 text-white/60">
                We respond within one business day. Existing customers receive a ticket confirmation instantly.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Name</label>
              <Input placeholder="Your name" {...form.register('name')} />
              {form.formState.errors.name ? (
                <p className="text-xs text-red-300">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Email</label>
              <Input type="email" placeholder="you@company.com" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-300">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Company / organisation</label>
              <Input placeholder="Organisation name" {...form.register('company')} />
              {form.formState.errors.company ? (
                <p className="text-xs text-red-300">{form.formState.errors.company.message}</p>
              ) : null}
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-white/70">How can we help?</label>
              <Textarea rows={6} placeholder="Share context, timelines, and goals" {...form.register('message')} />
              {form.formState.errors.message ? (
                <p className="text-xs text-red-300">{form.formState.errors.message.message}</p>
              ) : null}
            </div>
            <div>
              <Button type="submit" size="lg">
                {status === 'sent' ? 'Message sent' : 'Submit message'}
              </Button>
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
