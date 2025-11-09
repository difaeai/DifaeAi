import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const values = [
  {
    title: 'Mission',
    description:
      'Make AI-first security accessible for every guard force so people feel safe in the spaces they rely on.'
  },
  {
    title: 'Approach',
    description:
      'Blend human expertise with machine precision. DIFAE agents triage while operators stay in command.'
  },
  {
    title: 'Impact',
    description:
      'Over 7.2K incidents resolved each month across malls, industrial campuses, and smart city programs.'
  }
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold">About DIFAE</h1>
          <p className="max-w-3xl text-white/70">
            DIFAE is built by former SOC operators and ML engineers in Pakistan, helping enterprises predict and
            prevent physical security risks before they happen.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((item) => (
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
