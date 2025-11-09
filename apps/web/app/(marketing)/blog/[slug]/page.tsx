import { notFound } from 'next/navigation';
import { SiteHeader } from '../../../../components/site-header';
import { SiteFooter } from '../../../../components/site-footer';

const posts = {
  'ai-ops-checklist': {
    title: 'AI ops checklist for modern guard forces',
    body:
      'Roll out DIFAE in phases: baseline your camera health, configure alert templates, sync with guard dispatch, and monitor adoption with weekly retros.'
  },
  'soc-automation': {
    title: 'Automating SOC workflows with DIFAE',
    body:
      'See how SafeCity Cooperative orchestrates alerts into ticketing, voice bridges, and on-ground patrols while maintaining evidence trails.'
  }
} satisfies Record<string, { title: string; body: string }>;

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug as keyof typeof posts];

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1">
        <article className="max-w-3xl space-y-6">
          <h1 className="text-3xl font-semibold">{post.title}</h1>
          <p className="text-white/70 text-lg leading-relaxed">{post.body}</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
