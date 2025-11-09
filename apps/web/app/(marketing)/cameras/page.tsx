import Link from 'next/link';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const cameras = [
  {
    slug: 'dsg-pro',
    name: 'DSG Pro',
    summary: '4K rugged dome, 120m IR, built-in edge inference module.'
  },
  {
    slug: 'dsg-vision',
    name: 'DSG Vision',
    summary: 'PTZ 30x zoom, low-light starlight sensor, redundant power.'
  }
];

export default function CamerasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold">Cameras engineered for AI readiness</h1>
          <p className="max-w-3xl text-white/70">
            DIFAE-certified cameras ship pre-configured for edge inference, resilient networking, and remote fleet
            management.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {cameras.map((camera) => (
            <Card key={camera.slug}>
              <CardHeader>
                <Badge tone="accent">Certified</Badge>
                <CardTitle>{camera.name}</CardTitle>
                <CardDescription>{camera.summary}</CardDescription>
                <Link href={`/cameras/${camera.slug}`} className="text-sm text-[#22D3EE]">
                  Explore specs
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
