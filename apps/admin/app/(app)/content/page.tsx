'use client';

import { useState } from 'react';
import { Button, Card, CardDescription, CardHeader, CardTitle, Tabs } from '@difae/ui';

const tabs = [
  {
    id: 'plans',
    label: 'Plans',
    content: 'Manage pricing tiers synced with the marketing site.'
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    content: 'Collect customer quotes and publish to the carousel.'
  },
  {
    id: 'blog',
    label: 'Blog posts',
    content: 'Create new updates with hero images and SEO metadata.'
  }
];

export default function ContentPage() {
  const [activeTab] = useState(tabs[0].id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Content CMS</h1>
          <p className="text-sm text-white/60">Update site copy, pricing, testimonials, and blog posts.</p>
        </div>
        <Button>Create entry</Button>
      </div>
      <Tabs items={tabs} defaultValue={activeTab} />
      <Card>
        <CardHeader>
          <CardTitle>Storage library</CardTitle>
          <CardDescription>Connect Firebase Storage to browse logos and media assets.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
