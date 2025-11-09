import { SiteHeader } from '../../../../components/site-header';
import { SiteFooter } from '../../../../components/site-footer';
import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const specs = [
  '4K UHD sensor with 120m IR illumination',
  'Edge TPU module for on-device inference',
  'IK10 vandal resistance and IP67 weatherproofing',
  'Dual power input with PoE++ and DC fallback'
];

export default function DsgProPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1 gap-12">
        <div className="space-y-6">
          <Badge tone="accent">DSG Series</Badge>
          <h1 className="text-4xl font-semibold">DSG Pro</h1>
          <p className="max-w-3xl text-white/70">
            Built for mission-critical deployments, DSG Pro pairs rugged hardware with an embedded inference
            accelerator so alerts never miss the field.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Key specifications</CardTitle>
            <CardDescription>
              Engineering features tuned for DIFAE’s proactive analytics in high-traffic environments.
            </CardDescription>
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
