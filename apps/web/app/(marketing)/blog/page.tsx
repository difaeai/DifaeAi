import Link from 'next/link';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const posts = [
  {
    slug: 'ai-ops-checklist',
    title: 'AI ops checklist for modern guard forces',
    excerpt: 'Practical rollout guidance for integrating DIFAE agents with existing CCTV infrastructure.'
  },
  {
    slug: 'soc-automation',
    title: 'Automating SOC workflows with DIFAE',
    excerpt: 'See how municipal command centers triage thousands of alerts each week.'
  }
];

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold">Insights & updates</h1>
          <p className="max-w-2xl text-white/70">
            Field stories and product updates to help you orchestrate proactive security programs.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.slug}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
                <Link href={`/blog/${post.slug}`} className="text-sm text-[#22D3EE]">
                  Read article
                </Link>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
