import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const featureDetails = [
  {
    title: 'Threat Intelligence Fabric',
    description:
      'Layered detection models combine behaviour analytics, geofencing, and situational context to classify incidents with 99.1% accuracy.'
  },
  {
    title: 'Response Automation',
    description:
      'Automate guard routing, SOC escalations, and policy-driven messaging with audit trails for compliance teams.'
  },
  {
    title: 'Explainable AI',
    description:
      'Heatmaps, track overlays, and narrative summaries help operators trust every decision the agent makes.'
  }
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold">Feature architecture</h1>
          <p className="max-w-3xl text-white/70">
            DIFAE bundles computer vision, data pipelines, and action orchestration so your operators get verified,
            explainable alerts right when they need them.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {featureDetails.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
