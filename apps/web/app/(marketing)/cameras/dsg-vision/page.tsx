import { SiteHeader } from '../../../../components/site-header';
import { SiteFooter } from '../../../../components/site-footer';
import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const specs = [
  '30x optical zoom with AI auto-tracking',
  'Starlight sensor for 0.002 lux performance',
  'Redundant networking with LTE failover',
  'Pan tilt 360° continuous rotation'
];

export default function DsgVisionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1 gap-12">
        <div className="space-y-6">
          <Badge tone="accent">DSG Series</Badge>
          <h1 className="text-4xl font-semibold">DSG Vision</h1>
          <p className="max-w-3xl text-white/70">
            Tactical PTZ with night-optimized optics, perfect for city blocks and industrial campuses requiring
            proactive surveillance.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Key specifications</CardTitle>
            <CardDescription>Adaptive optics and networking built for continuous patrols.</CardDescription>
            <ul className="mt-6 space-y-3 text-sm text-white/70">
              {specs.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </CardHeader>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
