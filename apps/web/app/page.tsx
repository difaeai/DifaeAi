"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Accordion,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  LogoMarquee,
  MetricStat,
  VideoPlayer
} from '@difae/ui';
import { SiteHeader } from '../components/site-header';
import { SiteFooter } from '../components/site-footer';

const partnerLogos = [
  { src: '/logos/partner-1.svg', alt: 'Allied Bank' },
  { src: '/logos/partner-2.svg', alt: 'Siemens' },
  { src: '/logos/partner-3.svg', alt: 'Nayatel' },
  { src: '/logos/partner-4.svg', alt: 'Jazz' }
];

const capabilityHighlights = [
  {
    title: 'End-to-end vigilance',
    description:
      'Fuse every camera and sensor into a unified operating picture with live classification overlays and 24/7 health monitoring.'
  },
  {
    title: 'Response orchestration',
    description:
      'Automate playbooks for guards, SOC teams, and executives with real-time alerts, escalations, and accountability trails.'
  },
  {
    title: 'Insights that matter',
    description:
      'Compare locations, operators, and timelines with ready-made dashboards and PDF briefs that keep leadership aligned.'
  }
];

const featureCards = [
  {
    title: 'Predictive Threat Radar',
    description:
      'Advanced computer vision tuned for local conditions spots perimeter breaches, loitering, tailgating, and unattended baggage.'
  },
  {
    title: 'Incident Automation',
    description:
      'DIFAE Agent triages anomalies, enriches clips with metadata, and notifies the right team on WhatsApp, SMS, or the dashboard.'
  },
  {
    title: 'Evidence Locker',
    description:
      'Zero-trust media vault keeps high-value video, stills, and notes with chain-of-custody logging and expiry controls.'
  },
  {
    title: 'Overnight Briefings',
    description:
      'Nightly PDF summaries and KPI digests help you brief management and partners before the next shift even starts.'
  }
];

const agentPillars = [
  {
    title: 'Perception',
    copy: 'See the unseen with 99.1% accuracy across diverse lighting, weather, and crowd conditions.'
  },
  {
    title: 'Reasoning',
    copy: 'Temporal context links multi-camera events, correlating actors and assets across your estate.'
  },
  {
    title: 'Action',
    copy: 'Trigger SOPs, notify stakeholders, and capture acknowledgement trails from one orchestrated timeline.'
  }
];

const productSuites = [
  {
    name: 'DSG Pro Camera',
    description: 'Rugged edge AI camera with thermal support and smart zoom for industrial yards and campuses.',
    spec: 'IP67 • Dual 4K sensors • AI accelerator • LTE failover'
  },
  {
    name: 'DSG Vision Camera',
    description: 'Compact storefront and lobby coverage that balances cost and clarity with on-device analytics.',
    spec: '4MP HDR • 140° FOV • Edge inference • PoE ready'
  },
  {
    name: 'Command Console',
    description: 'Browser-based control centre with multi-location dashboards, alert routing, and response analytics.',
    spec: 'Role-based access • SOC ready • API integrations'
  },
  {
    name: 'Partner Integrations',
    description: 'Connect guard tour software, HR systems, and incident ticketing with a secure API-first foundation.',
    spec: 'REST & Webhooks • ISO 27001 hosting • Local support'
  }
];

const faqs = [
  {
    id: 'deploy',
    title: 'How quickly can we go live?',
    content: 'Most enterprises deploy in under 10 days with remote onboarding and guided calibration.'
  },
  {
    id: 'compliance',
    title: 'Is DIFAE compliant with our policies?',
    content:
      'Yes. DIFAE adheres to local data residency rules and provides audit trails for every incident interaction.'
  },
  {
    id: 'support',
    title: 'Do you offer 24/7 support?',
    content: 'Our security operations specialists are available round the clock via hotline, email, and WhatsApp.'
  }
];

const testimonials = [
  {
    name: 'Amina Qureshi',
    role: 'Security Director, Metro Mall',
    quote:
      'DIFAE turned our CCTV maze into an intelligent agent. Incident response times are down 63% and guard utilisation is finally predictable.'
  },
  {
    name: 'Omar Khalid',
    role: 'COO, SafeCity Cooperative',
    quote:
      'The proactive alerts catch anomalies before they escalate. Our municipal teams rely on DIFAE for every night patrol now.'
  }
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050815] text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden pb-24 pt-20">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#4F46E5]/40 blur-[160px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_65%)]" />
          </div>
          <div className="section-shell gap-16 md:flex-row md:items-center">
            <motion.div
              className="flex flex-1 flex-col gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge tone="accent" className="self-start">Proactive Security Cloud</Badge>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                DIFAE protects what matters before threats surface.
              </h1>
              <p className="max-w-xl text-lg text-white/70">
                Don’t just record crime—prevent it. DIFAE transforms your CCTV into a proactive AI security network
                that predicts risk, orchestrates responders, and preserves evidence flawlessly.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/difae-agent">Meet the DIFAE Agent</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/contact">Book a consultation</Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricStat label="Threat classification accuracy" value="99.1%" trend="Verified across 2.4M clips" />
                <MetricStat label="Incidents triaged monthly" value="7.2K+" trend="Across enterprise deployments" />
                <MetricStat label="Average alert lead time" value="42 sec" trend="From detection to response" />
              </div>
            </motion.div>
            <motion.div
              className="relative flex flex-1 items-center justify-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative flex h-[460px] w-[360px] items-center justify-center rounded-[36px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 shadow-[0_60px_120px_rgba(79,70,229,0.35)]">
                <Image src="/media/dashboard-mock.svg" alt="DIFAE dashboard" fill className="object-cover" />
                <div className="absolute -bottom-12 hidden w-[280px] rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur md:block">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Always-on coverage</p>
                  <p className="mt-2 text-sm text-white/80">Multi-location SOC view with incident timelines, agent status, and guard acknowledgements.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="section-shell gap-12">
          <h2 className="text-center text-sm uppercase tracking-[0.35em] text-white/40">Trusted by physical security leaders</h2>
          <LogoMarquee logos={partnerLogos} />
        </section>

        <section className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Security intelligence designed for modern estates</h2>
              <p className="text-white/70">
                DIFAE unifies cameras, analytics, and human workflows so every site operates with the same clarity and
                speed. Scale from a single facility to nationwide deployments with zero compromise on fidelity.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {capabilityHighlights.map((item) => (
                <Card key={item.title} className="bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Watch DIFAE Agent in action</h2>
              <p className="text-white/70">
                See how DIFAE Agent translates detections into guided response. From spotting intrusions to sharing
                incident clips, the agent keeps everyone in sync.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {agentPillars.map((pillar) => (
                  <Card key={pillar.title} className="border-white/10 bg-white/[0.03]">
                    <CardHeader>
                      <Badge tone="neutral" className="w-fit">{pillar.title}</Badge>
                      <CardDescription>{pillar.copy}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
            <VideoPlayer
              title="DIFAE Product Overview"
              src="https://www.youtube.com/embed/3fumBcKC6RE?rel=0"
              poster="/media/video-poster.svg"
            />
          </div>
        </section>

        <section className="section-shell">
          <div className="flex flex-col gap-10 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">What your team gains with DIFAE</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              From rapid detections to executive-ready reporting, DIFAE delivers a frictionless security workflow that
              delights operations and satisfies compliance teams.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="border-white/10 bg-white/[0.04]">
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
            <div className="max-w-xl space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Products engineered for proactive security</h2>
              <p className="text-white/70">
                Pair DIFAE Agent software with purpose-built hardware, SOC tooling, and integrations that accelerate
                deployment across any security estate.
              </p>
              <Button asChild>
                <Link href="/products">Explore the product line</Link>
              </Button>
            </div>
            <div className="grid flex-1 gap-6 md:grid-cols-2">
              {productSuites.map((product) => (
                <Card key={product.name} className="border-[#4F46E5]/40 bg-gradient-to-b from-[#4F46E5]/20 to-transparent">
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                    <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/60">{product.spec}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Stories from teams on the frontline</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              Security teams from malls, smart cities, and industrial parks trust DIFAE to predict incidents before they
              escalate.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((item) => (
              <Card key={item.name} className="border-white/10 bg-white/[0.04]">
                <CardHeader>
                  <CardDescription className="text-lg text-white/80">“{item.quote}”</CardDescription>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription>{item.role}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Frequently asked</h2>
              <p className="text-white/70">
                Straight answers about onboarding DIFAE and keeping your CCTV network compliant.
              </p>
            </div>
            <Accordion items={faqs} defaultOpenId="deploy" />
          </div>
        </section>

        <section className="py-24">
          <div className="section-shell flex flex-col items-center gap-6 rounded-[48px] bg-gradient-to-br from-[#4F46E5]/70 via-[#4338CA]/70 to-[#0EA5E9]/60 p-12 text-center shadow-[0_40px_120px_rgba(79,70,229,0.45)]">
            <h2 className="text-3xl font-semibold md:text-4xl">Ready to modernise your security operations?</h2>
            <p className="max-w-2xl text-white/80">
              Let’s design the ideal rollout for your cameras, SOPs, and teams. DIFAE specialists will share a tailored
              readiness assessment within one business day.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Talk to our architects</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/auth/sign-up">Start a free trial</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
