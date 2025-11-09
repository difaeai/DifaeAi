import Link from 'next/link';
import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Accordion, Badge, Button, Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const agentLayers = [
  {
    title: 'Scene intelligence',
    description:
      'DIFAE Agent senses every frame with tailored models for intrusion, anomaly, and behaviour analytics tuned to your estate.'
  },
  {
    title: 'Knowledge graph',
    description:
      'Cross-link incidents, locations, and personnel to understand root cause, related events, and compliance impact instantly.'
  },
  {
    title: 'Workflow automation',
    description:
      'Trigger escalations, share context, and capture acknowledgements across WhatsApp, SMS, email, and the DIFAE console.'
  }
];

const automationFlows = [
  {
    title: 'Perimeter breach',
    steps: ['Edge detection verifies intrusion', 'Agent flags high severity alert', 'Guard patrol receives live clip', 'Supervisor signs off with notes']
  },
  {
    title: 'Asset removal',
    steps: ['DIFAE tracks asset across cameras', 'Creates evidence locker entry', 'Alerts security and facilities', 'Generates overnight report update']
  },
  {
    title: 'Visitor escalation',
    steps: ['Face match hits VIP watchlist', 'Concierge notified in real-time', 'Agent opens incident timeline', 'Compliance logs the interaction']
  }
];

const faqs = [
  {
    id: 'deployment',
    title: 'How does onboarding work?',
    content:
      'We connect your cameras via guided setup, calibrate detection models with your footage, and validate SOP routing before going live.'
  },
  {
    id: 'privacy',
    title: 'Where is data stored?',
    content: 'DIFAE stores media in-region with encryption at rest, granular retention policies, and tamper-evident logging.'
  },
  {
    id: 'training',
    title: 'Can we train custom detections?',
    content:
      'Yes. Our ML specialists build custom classifiers from your labelled footage and continuously retrain for new environments.'
  }
];

export default function DifaeAgentPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050815] text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="section-shell gap-12 pb-20 pt-24">
          <div className="flex flex-col gap-6 md:max-w-3xl">
            <Badge tone="accent" className="w-fit">DIFAE AI Agent</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Your digital security specialist that sees, reasons, and responds.
            </h1>
            <p className="text-lg text-white/70">
              DIFAE Agent gives every camera a command centre brain—delivering proactive intelligence, human-friendly alerts,
              and unified response workflows.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild>
                <Link href="#layers">Explore capabilities</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/contact">Book a live demo</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="layers" className="section-shell">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Three layers of intelligence</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              DIFAE Agent combines perception, reasoning, and automation into one orchestrated platform.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {agentLayers.map((layer) => (
              <Card key={layer.title} className="border-white/10 bg-white/[0.04]">
                <CardHeader>
                  <CardTitle>{layer.title}</CardTitle>
                  <CardDescription>{layer.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Automations that keep teams in lockstep</h2>
              <p className="text-white/70">
                Every automation flow comes with configurable severity thresholds, guard assignments, and compliance checklists.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {automationFlows.map((flow) => (
                <Card key={flow.title} className="border-[#4F46E5]/40 bg-gradient-to-b from-[#4F46E5]/20 to-transparent">
                  <CardHeader>
                    <CardTitle>{flow.title}</CardTitle>
                    <CardDescription>
                      <ul className="mt-4 space-y-2 text-sm text-white/70">
                        {flow.steps.map((step) => (
                          <li key={step}>• {step}</li>
                        ))}
                      </ul>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell pb-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Deep dives & FAQs</h2>
              <p className="text-white/70">
                Learn how DIFAE Agent fits into your operations and integrates with existing command centres, guard patrols,
                and compliance workflows.
              </p>
            </div>
            <Accordion items={faqs} defaultOpenId="deployment" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
