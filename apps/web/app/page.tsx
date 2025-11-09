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

const features = [
  {
    title: 'Threat Detection',
    description:
      'Detect perimeter breaches, loitering, and suspicious packages with high-precision AI models tuned for South Asian environments.'
  },
  {
    title: 'Theft Detection',
    description:
      'Identify theft signals from multi-camera feeds, linking clips and timestamps so responders can act instantly.'
  },
  {
    title: 'Face Recognition',
    description:
      'Match visitors against blocklists or VIP registries while staying compliant with local privacy regulations.'
  },
  {
    title: 'Instant Alerts',
    description:
      'Push alerts to WhatsApp, email, or the DIFAE dashboard in under 42 seconds with verified metadata.'
  },
  {
    title: 'Night Reports PDF',
    description:
      'Automated nightly summary delivered as branded PDF, highlighting anomalies, escalations, and camera uptime.'
  },
  {
    title: 'Evidence Locker',
    description:
      'Secure cloud locker keeps incident clips, transcripts, and response notes in one encrypted workspace.'
  }
];

const faqs = [
  {
    id: 'coverage',
    title: 'What camera systems does DIFAE support?',
    content:
      'RTSP, HTTP, and ONVIF-compatible NVRs are supported. You can onboard both legacy CCTV and modern IP cameras within minutes.'
  },
  {
    id: 'privacy',
    title: 'How is data secured?',
    content:
      'All incident data is encrypted at rest, with configurable retention policies and granular admin controls.'
  },
  {
    id: 'deployment',
    title: 'Do you offer on-premise options?',
    content:
      'Yes. Hybrid deployments run DIFAE analytics at the edge while syncing summaries to the cloud for redundancy.'
  }
];

const steps = [
  {
    title: 'Connect cameras',
    description:
      'Authenticate cameras through guided setup, validating stream health and lens calibration automatically.'
  },
  {
    title: 'Train agent',
    description:
      'Tune detection templates to your environment with rapid feedback loops and scenario presets.'
  },
  {
    title: 'Automate response',
    description:
      'Route incidents to guard teams, SOC dashboards, and workflows with integrations to Slack, Teams, and more.'
  }
];

const testimonials = [
  {
    name: 'Amina Qureshi',
    role: 'Security Director, Metro Mall',
    quote:
      'DIFAE turned our CCTV maze into an intelligent agent. Incident response times are down 63% and guard utilization is finally predictable.'
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden pb-24 pt-16">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.28),_transparent_60%)]" />
          </div>
          <div className="section-shell gap-12 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col gap-8">
              <Badge tone="accent">Proactive Security Cloud</Badge>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                Don’t just record crime—prevent it.
              </h1>
              <p className="max-w-xl text-lg text-white/70">
                DIFAE transforms your CCTV into a proactive AI security network. Classify threats, triage
                incidents, and dispatch response teams in seconds.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/pricing">Explore plans</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/support">Meet DIFAE Agent</Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricStat label="Threat classification accuracy" value="99.1%" trend="Validated on 2.4M clips" />
                <MetricStat label="Incidents triaged monthly" value="7.2K+" trend="Across enterprise deployments" />
                <MetricStat label="Average alert lead time" value="42 sec" trend="From detection to response" />
              </div>
            </div>
            <motion.div
              className="relative flex flex-1 items-center justify-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative h-[420px] w-[320px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 shadow-[0_50px_120px_rgba(79,70,229,0.35)]">
                <Image src="/media/dashboard-mock.svg" alt="DIFAE dashboard" fill className="object-cover" />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="section-shell gap-8">
          <h2 className="text-center text-sm uppercase tracking-[0.2em] text-white/40">
            Trusted by physical security leaders
          </h2>
          <LogoMarquee logos={partnerLogos} />
        </section>

        <section className="section-shell">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Product video tour</h2>
              <p className="text-white/70">
                Watch the DIFAE Agent orchestrate real-time alerts, explainable detections, and SOC handoffs in
                under five minutes.
              </p>
            </div>
            <VideoPlayer
              title="DIFAE Product Overview"
              src="https://www.youtube.com/embed/3fumBcKC6RE?rel=0"
              poster="/media/video-poster.svg"
            />
          </div>
        </section>

        <section className="section-shell">
          <div className="flex flex-col gap-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Intelligence for every security workflow</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              DIFAE wraps modern computer vision with operational playbooks so your team can see threats, act
              faster, and stay compliant.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step.title} className="bg-gradient-to-b from-white/10 to-white/[0.04]">
                <CardHeader>
                  <Badge tone="neutral">Step {index + 1}</Badge>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="flex flex-col gap-10 lg:flex-row">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Plans & Pricing</h2>
              <p className="text-white/70">
                Choose a plan that scales with your footprint. Annual billing saves up to 18% and unlocks custom
                onboarding.
              </p>
              <Button asChild size="lg">
                <Link href="/pricing">Compare plans</Link>
              </Button>
            </div>
            <div className="grid flex-1 gap-6">
              <Card>
                <CardHeader>
                  <Badge tone="neutral">Starter</Badge>
                  <CardTitle>PKR 45,000 / month</CardTitle>
                  <CardDescription>
                    Ideal for single-site deployments needing critical alerts, PDF reporting, and responsive
                    support.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-[#22D3EE]/30 bg-gradient-to-b from-[#4F46E5]/20 to-transparent">
                <CardHeader>
                  <Badge tone="accent">Growth — Most popular</Badge>
                  <CardTitle>PKR 125,000 / month</CardTitle>
                  <CardDescription>
                    Multi-site automation with workflow routing, custom alert channels, and advanced analytics.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Badge tone="neutral">Enterprise</Badge>
                  <CardTitle>Let’s design your program</CardTitle>
                  <CardDescription>
                    Dedicated success architect, 24/7 SOC handoff, and white-glove deployments across regions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="section-shell">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Testimonials</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              Security teams from malls, smart cities, and industrial parks trust DIFAE to predict incidents before
              they escalate.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((item) => (
              <Card key={item.name}>
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
            <Accordion items={faqs} defaultOpenId="coverage" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
