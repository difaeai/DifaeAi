import Link from 'next/link';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const cameraLine = [
  {
    name: 'DSG Pro',
    badge: 'Flagship',
    summary: 'Industrial-grade PTZ with dual sensors, thermal fusion, and built-in AI accelerator.',
    spec: 'IP67 • Dual 4K/thermal • 20x optical zoom • LTE failover • PoE++'
  },
  {
    name: 'DSG Vision',
    badge: 'Smart retail',
    summary: 'Compact fixed dome for lobbies, retail floors, and office corridors with on-edge analytics.',
    spec: '4MP HDR • 140° FOV • Edge TPU • PoE'
  }
];

const softwareSuites = [
  {
    title: 'Command Console',
    description:
      'Centralise guard workflows with live incident timelines, map visualisation, and SOC-friendly dashboards. Role-based access ensures the right people see the right data.'
  },
  {
    title: 'Incident Locker',
    description:
      'Secure storage for clips, stills, and notes with tamper-evident logs and configurable retention for compliance.'
  },
  {
    title: 'Automated Briefings',
    description:
      'Overnight PDF and email digests summarise anomalies, guard actions, and readiness KPIs for leadership.'
  }
];

const integrations = [
  {
    name: 'Guard tour systems',
    description: 'Sync patrol checkpoints with incident data to track guard response and coverage.'
  },
  {
    name: 'Incident management',
    description: 'Send verified alerts to ServiceNow, Jira Service Management, or your in-house ticketing.'
  },
  {
    name: 'Business intelligence',
    description: 'Export metrics to PowerBI, Tableau, or Looker for executive scorecards and budgeting.'
  }
];

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050815] text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="section-shell gap-12 pb-20 pt-24">
          <div className="flex flex-col gap-6 md:max-w-3xl">
            <Badge tone="accent" className="w-fit">Product portfolio</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Hardware, software, and services working as one security stack.
            </h1>
            <p className="text-lg text-white/70">
              DIFAE pairs purpose-built AI cameras with enterprise orchestration tools and integrations so you can deploy a
              proactive security programme faster.
            </p>
          </div>
        </section>

        <section className="section-shell">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Camera line-up</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              Intelligent cameras engineered for harsh outdoor sites and elegant indoor spaces alike.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {cameraLine.map((camera) => (
              <Card key={camera.name} className="border-[#22D3EE]/30 bg-gradient-to-b from-[#22D3EE]/10 to-transparent">
                <CardHeader>
                  <Badge tone="neutral" className="w-fit uppercase tracking-[0.3em] text-[10px]">
                    {camera.badge}
                  </Badge>
                  <CardTitle className="mt-3 text-2xl">{camera.name}</CardTitle>
                  <CardDescription>{camera.summary}</CardDescription>
                  <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/60">{camera.spec}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Software to orchestrate every response</h2>
              <p className="text-white/70">
                Activate DIFAE Agent capabilities with modular software suites that keep your teams coordinated—from SOC to field guards.
              </p>
              <Button asChild>
                <Link href="/difae-agent">Meet DIFAE Agent</Link>
              </Button>
            </div>
            <div className="grid gap-6">
              {softwareSuites.map((suite) => (
                <Card key={suite.title} className="border-white/10 bg-white/[0.04]">
                  <CardHeader>
                    <CardTitle>{suite.title}</CardTitle>
                    <CardDescription>{suite.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell pb-24">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Connect DIFAE with your ecosystem</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              Use our open APIs and partner connectors to plug into the tools your security and compliance teams already trust.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {integrations.map((integration) => (
              <Card key={integration.name} className="border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
