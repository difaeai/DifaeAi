"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Handshake, Lightbulb, ShieldCheck, Loader2, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageAssistant } from "@/components/page-assistant";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageSection } from "@/components/ui/page-section";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { Container } from "@/components/ui/container";

async function getPageContent(pageName: string): Promise<any> {
  const docRef = doc(db, "content", pageName);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

const values = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: "Innovation",
    description:
      "We are driven by a passion for discovery, constantly pushing the boundaries of what's possible in AI security.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "Integrity",
    description:
      "We uphold the highest standards of quality and ethics, ensuring our technology is used responsibly to create a safer world.",
  },
  {
    icon: <Handshake className="h-8 w-8 text-primary" />,
    title: "Customer Commitment",
    description:
      "Our clients are our partners. We are dedicated to providing security solutions that deliver real, measurable value.",
  },
];

export default function AboutPage() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const pageContent = await getPageContent("aboutpage");
        setContent(pageContent);
      } catch (error) {
        console.error("Failed to fetch page content", error);
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
          <Container className="grid gap-12 pb-20 lg:grid-cols-[1.2fr,1fr] lg:items-center">
            <FadeIn className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Our mission</p>
              <h1 className="font-headline text-4xl font-semibold tracking-tight sm:text-5xl">
                {content?.hero?.headline ?? "Who we are"}
              </h1>
              <p
                className="max-w-2xl text-lg text-text/70"
                dangerouslySetInnerHTML={{
                  __html:
                    content?.hero?.description ??
                    "DIFAE transforms how cities and enterprises respond to risk. Our teams combine security expertise with advanced AI to keep people, places, and assets safe.",
                }}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/contact">Meet the team</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full border border-primary/20 bg-white text-primary hover:bg-primary/10">
                  <Link href="/products">Explore DIFAE</Link>
                </Button>
              </div>
            </FadeIn>
            <FadeIn delay={150} className="rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-xl font-semibold text-text">Fast facts</h3>
              <div className="mt-6 grid gap-6 text-sm text-text/70">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Founded</p>
                  <p className="mt-2 text-lg font-semibold text-text">2019 in Islamabad</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Coverage</p>
                  <p className="mt-2 text-lg font-semibold text-text">35 cities and growing</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Customers protected</p>
                  <p className="mt-2 text-lg font-semibold text-text">Banks, retailers, logistics leaders</p>
                </div>
              </div>
            </FadeIn>
          </Container>
        </section>

        <PageSection>
          <FadeIn className="mx-auto max-w-3xl space-y-6 text-center">
            <GradientHeading>From innovation studio to AI security leader</GradientHeading>
            <p className="text-lg text-text/70">
              {content?.story?.headline ?? "From vision to a global service"}
            </p>
            <p className="text-base text-text/60" dangerouslySetInnerHTML={{ __html: content?.story?.p1 ?? "Started in 2019, BERRETO Pvt Ltd. established itself as a leading development and design partner for ambitious organisations across the world." }} />
            <p className="text-base text-text/60">
              {content?.story?.p2 ?? "Today, we channel that expertise into DIFAE AI, our flagship security platform delivering proactive protection for cities, campuses, and enterprises."}
            </p>
          </FadeIn>
        </PageSection>

        <PageSection background="muted">
          <FadeIn className="space-y-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Mission & Vision</p>
              <GradientHeading className="mt-4">Purpose that shapes every deployment</GradientHeading>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Target className="h-10 w-10 text-primary" />
                  <CardTitle className="font-headline text-2xl text-text">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-sm text-text/70"
                    dangerouslySetInnerHTML={{
                      __html:
                        content?.missionVision?.mission ??
                        "To deliver superior AI-driven security solutions that provide measurable value and peace of mind for organisations and communities.",
                    }}
                  />
                </CardContent>
              </Card>
              <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Eye className="h-10 w-10 text-primary" />
                  <CardTitle className="font-headline text-2xl text-text">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text/70">
                    {content?.missionVision?.vision ??
                      "To become a leading force in the global security industry by delivering AI solutions that prevent incidents before they escalate."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </PageSection>

        <PageSection>
          <FadeIn className="space-y-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Our Values</p>
              <GradientHeading className="mt-4">The principles that guide every decision</GradientHeading>
              <p className="mt-3 text-lg text-text/70">
                Our culture is built on trust, experimentation, and uncompromising security standards.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {values.map((value) => (
                <div key={value.title} className="rounded-3xl border border-border/60 bg-white/80 p-6 text-center shadow-lg shadow-primary/10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">{value.icon}</div>
                  <h4 className="mt-6 font-headline text-xl font-semibold text-text">{value.title}</h4>
                  <p className="mt-3 text-sm text-text/70">{value.description}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </PageSection>

        <PageSection background="tint">
          <FadeIn className="grid gap-10 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <div className="space-y-6">
              <GradientHeading>Global perspective, local delivery</GradientHeading>
              <p className="max-w-2xl text-lg text-text/70">
                DIFAE is built by engineers, data scientists, and security experts collaborating across Pakistan and the broader region to deliver rapid innovation with enterprise-grade reliability.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/10">
                  <Globe className="h-8 w-8 text-primary" />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Operational footprint</p>
                  <p className="mt-2 text-lg text-text">Monitoring 5+ countries with regional partners</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Security experts</p>
                  <p className="mt-2 text-lg text-text">Certified analysts and architects on-call 24/7</p>
                </div>
              </div>
            </div>
            <div className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-2xl font-semibold text-text">Join us</h3>
              <p className="text-sm text-text/70">
                We are building the next generation of AI security infrastructure. If you’re passionate about protecting communities with technology, we want to hear from you.
              </p>
              <Button asChild className="rounded-full">
                <Link href="mailto:hello@berreto.co">Send your portfolio</Link>
              </Button>
            </div>
          </FadeIn>
        </PageSection>
      </main>
      <Footer />
      <PageAssistant pageContext="about" />
    </div>
  );
}
