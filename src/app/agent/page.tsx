"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  AlertOctagon,
  Flame,
  FileText,
  BrainCircuit,
  Siren,
  Network,
  Radar,
  Radio,
  Eye,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageAssistant } from "@/components/page-assistant";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageSection } from "@/components/ui/page-section";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { Container } from "@/components/ui/container";
import { Timeline } from "@/components/ui/timeline";
import { MetricCard } from "@/components/ui/metric-card";

async function getPageContent(pageName: string): Promise<any> {
  const docRef = doc(db, "content", pageName);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

const keyFeatures = [
  {
    icon: ShieldAlert,
    title: "AI-powered theft protection",
    description:
      "Detect intruders, prevent theft attempts, and coordinate rapid response with a single command centre.",
  },
  {
    icon: Users,
    title: "Identity intelligence",
    description:
      "Cross-verify faces with approved lists and social intelligence to secure high-risk zones with confidence.",
  },
  {
    icon: AlertOctagon,
    title: "Unauthorized access control",
    description:
      "Upload watchlists and receive immediate alerts across every connected camera the moment a person is detected.",
  },
  {
    icon: Flame,
    title: "Gun, fire, and smoke detection",
    description:
      "Instantly recognize firearms and hazards, dispatching authorities before incidents escalate.",
  },
  {
    icon: FileText,
    title: "Event-grade evidence",
    description:
      "Receive timestamped PDF reports with annotated frames so investigations and audits take minutes, not days.",
  },
  {
    icon: Siren,
    title: "Autonomous playbooks",
    description:
      "Trigger sirens, calls, and perimeter lockdowns automatically while logging every action for compliance.",
  },
];

const workflow = [
  {
    title: "Perceive",
    description: "Edge AI observes every feed, learns your environment, and tags behaviours in real time.",
  },
  {
    title: "Decide",
    description: "Risk scores, identity context, and policy rules determine the right response path automatically.",
  },
  {
    title: "Deploy",
    description: "Playbooks coordinate sirens, guards, and authorities while evidence packages sync instantly.",
  },
];

const architecturePillars = [
  {
    icon: BrainCircuit,
    title: "Neural perception engine",
    description: "Multi-modal AI stacks tuned for low light, crowds, and fast motion across diverse camera hardware.",
  },
  {
    icon: Network,
    title: "Distributed mesh",
    description: "Edge nodes continue safeguarding your perimeter even when connectivity or power is unstable.",
  },
  {
    icon: Radar,
    title: "Predictive intelligence",
    description: "Proprietary models forecast risk hotspots and operator workload, optimising guard routes and staffing.",
  },
  {
    icon: Radio,
    title: "Command exchange",
    description: "Secure voice, SMS, and app channels deliver alerts with actionable context to every stakeholder.",
  },
];

const integrationHighlights = [
  "Access control systems",
  "Smart sirens & strobes",
  "VMS & NVR platforms",
  "Drone & robotics fleets",
  "Emergency call centres",
  "Guard management apps",
];

export default function AgentPage() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const pageContent = await getPageContent("agentpage");
        setContent(pageContent);
      } catch (error) {
        console.error("Failed to fetch agent page content", error);
      }
    }

    fetchContent();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-white to-accent/5" />
          <Container className="grid gap-12 pb-20 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <FadeIn className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">DIFAE AI Agent</p>
              <h1 className="font-headline text-4xl font-semibold tracking-tight sm:text-5xl">
                {content?.hero?.headline ?? "The autonomous security specialist"}
              </h1>
              <p
                className="max-w-2xl text-lg text-text/70"
                dangerouslySetInnerHTML={{
                  __html:
                    content?.hero?.description ??
                    "DIFAE agents watch every pixel, predict risk, and coordinate human responders—giving your organisation minutes of advantage when seconds matter.",
                }}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/products">Explore deployment</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full border border-primary/20 bg-white text-primary hover:bg-primary/10">
                  <Link href="/contact">Talk to architects</Link>
                </Button>
              </div>
            </FadeIn>
            <FadeIn delay={150} className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-xl font-semibold text-text">Designed for relentless protection</h3>
              <p className="text-sm text-text/70">
                Trained on millions of security incidents across retail, banking, logistics, and smart city deployments.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard label="Incident reduction" value="-68%" icon={<ShieldCheck className="h-6 w-6" />} />
                <MetricCard label="Verified alerts" value="99%" icon={<Eye className="h-6 w-6" />} />
              </div>
            </FadeIn>
          </Container>
        </section>

        <PageSection>
          <FadeIn className="space-y-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Key capabilities</p>
              <GradientHeading className="mt-4">Every module engineered to prevent incidents</GradientHeading>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {keyFeatures.map((feature, index) => (
                <FadeIn key={feature.title} delay={index * 60} className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/10">
                  <feature.icon className="h-10 w-10 text-primary" />
                  <h3 className="mt-6 font-headline text-xl font-semibold text-text">{feature.title}</h3>
                  <p className="mt-3 text-sm text-text/70">{feature.description}</p>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </PageSection>

        <PageSection background="muted">
          <FadeIn className="space-y-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Agent workflow</p>
              <GradientHeading className="mt-4">How DIFAE keeps you ahead of every incident</GradientHeading>
              <p className="mt-3 text-lg text-text/70">
                Each step is observable, auditable, and designed to align with your operating procedures and regulatory needs.
              </p>
            </div>
            <Timeline items={workflow} />
          </FadeIn>
        </PageSection>

        <PageSection>
          <FadeIn className="space-y-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Architecture</p>
              <GradientHeading className="mt-4">Built for scale, resilience, and trust</GradientHeading>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {architecturePillars.map((pillar, index) => (
                <FadeIn key={pillar.title} delay={index * 80}>
                  <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <pillar.icon className="h-10 w-10 text-primary" />
                      <div>
                        <CardTitle className="text-xl font-semibold text-text">{pillar.title}</CardTitle>
                        <CardDescription className="text-sm text-text/70">{pillar.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </PageSection>

        <PageSection background="tint">
          <FadeIn className="grid gap-10 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <div className="space-y-6">
              <GradientHeading>Seamless integration ecosystem</GradientHeading>
              <p className="max-w-2xl text-lg text-text/70">
                DIFAE fits into your existing infrastructure without replacing your trusted systems. Our API-driven architecture keeps every connection secure.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {integrationHighlights.map((item) => (
                  <div key={item} className="rounded-3xl border border-border/60 bg-white/80 px-5 py-4 text-sm font-semibold text-primary shadow-inner shadow-primary/10">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-2xl font-semibold text-text">Compliance without compromise</h3>
              <p className="text-sm text-text/70">
                DIFAE maintains tamper-proof audit trails, encrypted data retention, and configurable privacy controls that meet the toughest standards.
              </p>
              <Button asChild className="rounded-full">
                <Link href="/contact">Request compliance briefing</Link>
              </Button>
            </div>
          </FadeIn>
        </PageSection>
      </main>
      <Footer />
      <PageAssistant pageContext="agent" />
    </div>
  );
}
