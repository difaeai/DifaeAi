"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldCheck,
  Bot,
  Video,
  LocateFixed,
  ScanFace,
  Siren,
  Lock,
  LineChart,
  Waves,
  Radar,
  ArrowUpRight,
  Building,
  Home,
  Factory,
  BadgeCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageAssistant } from "@/components/page-assistant";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { Container } from "@/components/ui/container";
import { PageSection } from "@/components/ui/page-section";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { MetricCard } from "@/components/ui/metric-card";
import { FeatureCard } from "@/components/ui/feature-card";
import { Timeline } from "@/components/ui/timeline";
import { PricingCard } from "@/components/ui/pricing-card";
import { VideoFrame } from "@/components/ui/video-frame";
import { LogoCloud } from "@/components/ui/logo-cloud";

async function getPageContent(pageName: string): Promise<any> {
  const docRef = doc(db, "content", pageName);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

async function getProducts(): Promise<Product[]> {
  const productsCollection = collection(db, "products");
  const q = query(productsCollection, orderBy("name"));
  const productsSnapshot = await getDocs(q);
  if (productsSnapshot.empty) return [];
  return productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
}

const heroStats = [
  { label: "Threat classification accuracy", value: "99.1%" },
  { label: "Incidents triaged monthly", value: "7.2K+" },
  { label: "Average alert lead time", value: "42 sec" },
];

const intelligenceLayers = [
  {
    title: "Situational Awareness Mesh",
    description:
      "Bring every feed, floor plan, and safe zone online in minutes. BERRETO calibrates spatial awareness instantly—no new wiring required.",
    points: [
      "Connect legacy CCTV, IP cameras, or drone feeds within minutes.",
      "Auto-map safe zones, blind spots, and escalation tiers.",
      "Edge intelligence keeps monitoring alive even if the network drops.",
    ],
    icon: LocateFixed,
  },
  {
    title: "Adaptive Risk Intelligence",
    description:
      "The agent learns the rhythm of your environment, scoring anomalies and prioritising what matters to your business.",
    points: [
      "Understands behaviour patterns unique to every site.",
      "Continuously improves with operator feedback loops.",
      "Filters false positives to keep teams focused on true threats.",
    ],
    icon: Bot,
  },
  {
    title: "Escalation You Can Trust",
    description:
      "Human-verified alerts include video highlights, identity context, and recommended actions so you can act decisively.",
    points: [
      "One-tap escalation to owners, guards, or emergency services.",
      "Automated call trees with multilingual voice synthesis.",
      "Evidence packages ready for insurers and authorities in seconds.",
    ],
    icon: ShieldCheck,
  },
];

const journeySteps = [
  {
    title: "Connect",
    description:
      "Pair cameras, choose safe zones, and define what BERRETO should watch. No rewiring. No hardware lock-in.",
  },
  {
    title: "Teach",
    description:
      "The agent learns your daily rhythm, identifies high-value assets, and syncs playbooks across your team.",
  },
  {
    title: "Activate",
    description:
      "Receive proactive alerts with the context and recommendations you need to intervene before harm occurs.",
  },
];

const sectors = [
  { icon: Home, label: "Smart estates" },
  { icon: Building, label: "Commercial towers" },
  { icon: Factory, label: "Industrial yards" },
  { icon: BadgeCheck, label: "Critical infrastructure" },
];

const capabilityHighlights = [
  {
    icon: ShieldCheck,
    title: "Predictive Threat Intelligence",
    description:
      "BERRETO watches every pixel for emerging risks, comparing context, movement, and intent to predict incidents before they unfold.",
    badge: "Proactive AI",
    href: "/agent#features",
  },
  {
    icon: Siren,
    title: "Autonomous Response Playbooks",
    description:
      "Escalate to guards, owners, or authorities with confidence. BERRETO’s playbooks coordinate calls, sirens, and evidence packs automatically.",
    badge: "Autonomous",
    href: "/agent#features",
  },
  {
    icon: ScanFace,
    title: "Identity & Evidence Engine",
    description:
      "Facial recognition and tamper-proof audit trails build a complete story of every incident for rapid investigations.",
    badge: "Forensics",
    href: "/products",
  },
  {
    icon: Video,
    title: "Unified Perimeter Coverage",
    description:
      "Connect CCTV, IP cameras, and new BERRETO devices into one live command centre with end-to-end encryption.",
    badge: "360° Coverage",
    href: "/products",
  },
];

const pricingHighlights = [
  {
    name: "BERRETO Launch",
    price: "Rs 39,000/mo",
    description: "AI command centre, alert automation, and 24/7 SOC support for a single site.",
    features: [
      "Up to 16 video feeds",
      "Real-time threat triage",
      "Incident evidence vault",
      "Human-in-the-loop escalation",
    ],
    ctaLabel: "Start coverage",
    ctaHref: "/products",
  },
  {
    name: "BERRETO Scale",
    price: "Custom",
    description: "Enterprise-wide prevention with role-based dashboards, analytics, and premium support.",
    features: [
      "Unlimited feeds & sites",
      "Autonomous response playbooks",
      "Advanced analytics & reporting",
      "Dedicated security architect",
    ],
    ctaLabel: "Design my deployment",
    ctaHref: "/contact",
    featured: true,
  },
];

const partnerLogos = [
  { name: "Allied Bank" },
  { name: "SafeCity" },
  { name: "Serene Retail" },
  { name: "National Grid" },
  { name: "AeroGuard" },
  { name: "MetroHub" },
];

export default function HomePage() {
  const [content, setContent] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    async function fetchData() {
      try {
        const [pageContent, productList] = await Promise.all([
          getPageContent("homepage"),
          getProducts(),
        ]);
        setContent(pageContent);
        setProducts(productList);
      } catch (error) {
        console.error("Failed to load homepage content", error);
      }
    }

    fetchData();
  }, []);

  const featuredProduct = useMemo(() => products[0], [products]);
  const handleAddFeatured = () => {
    if (!featuredProduct) return;
    addToCart({
      id: featuredProduct.id,
      name: featuredProduct.name,
      price: featuredProduct.price ?? 0,
      image: featuredProduct.images?.[0] ?? "",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/8 via-accent/5 to-white" />
          <Container className="relative grid gap-12 pb-24 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <FadeIn className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Proactive Security Cloud
              </div>
              <h1 className="font-headline text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Don’t Just Record Crime. Prevent It.
              </h1>
              <p className="max-w-xl text-lg text-foreground">
                BERRETO transforms your CCTV into a proactive AI security network. Predict threats, orchestrate responses, and deliver trusted evidence before incidents escalate.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-8 text-base">
                  <Link href="/products">Explore plans</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full border border-primary/20 bg-white px-8 text-base text-primary hover:bg-primary/10">
                  <Link href="/agent">Meet BERRETO Agent</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-border/60 bg-white/80 p-5 shadow-lg shadow-primary/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{stat.label}</p>
                    <p className="mt-3 text-2xl font-headline font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <VideoFrame
                videoId={content?.hero?.videoId ?? "9KsJnCt3NVE"}
                title="BERRETO Security Cloud overview"
                className="shadow-2xl"
              />
            </FadeIn>
          </Container>
        </section>

        <PageSection background="tint">
          <div className="grid gap-12 lg:grid-cols-[1fr,1.1fr] lg:items-center">
            <FadeIn delay={100} className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-white shadow-2xl shadow-primary/20">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img 
                    src="/images/ai_surveillance_secu_fa89eccd.jpg" 
                    alt="DIFAE AI Surveillance System" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm font-semibold opacity-90">AI-Powered Threat Detection</p>
                  <p className="mt-1 text-2xl font-headline font-semibold">Real-time. Intelligent. Proactive.</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn className="order-1 space-y-6 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary shadow-lg">
                <Bot className="h-3.5 w-3.5" /> Introducing DIFAE AI Agent
              </div>
              <GradientHeading>Meet DIFAE: Your 24/7 AI Security Agent</GradientHeading>
              <p className="text-lg text-foreground">
                DIFAE AI is BERRETO's intelligent surveillance agent that transforms ordinary cameras into a predictive security network. It watches, learns, and protects your perimeter 24/7 by detecting threats before they escalate.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-primary/20 bg-white p-4 shadow-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-semibold">Threat Prediction</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Identifies suspicious behavior patterns and alerts you before incidents occur</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-primary/20 bg-white p-4 shadow-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <ScanFace className="h-5 w-5" />
                    <span className="text-sm font-semibold">Face Recognition</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Instantly identifies known individuals and alerts on unauthorized access</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-primary/20 bg-white p-4 shadow-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <Siren className="h-5 w-5" />
                    <span className="text-sm font-semibold">Auto Response</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Triggers sirens, alerts authorities, and coordinates response automatically</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-primary/20 bg-white p-4 shadow-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <Lock className="h-5 w-5" />
                    <span className="text-sm font-semibold">24/7 Monitoring</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Never sleeps, never misses a threat—always protecting your assets</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/agent">Explore DIFAE AI Capabilities</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full border border-primary/20 bg-white text-primary hover:bg-primary/10">
                  <Link href="/contact">Request a Demo</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </PageSection>

        <PageSection className="pt-0">
          <FadeIn>
            <div className="space-y-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Trusted protection</p>
              <GradientHeading className="mx-auto max-w-3xl">
                Built with partners safeguarding millions of square feet every day
              </GradientHeading>
              <LogoCloud logos={partnerLogos} className="mx-auto max-w-5xl" />
            </div>
          </FadeIn>
        </PageSection>

        <PageSection background="tint">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <FadeIn className="space-y-6">
              <GradientHeading>Security that learns your perimeter</GradientHeading>
              <p className="max-w-2xl text-lg text-foreground">
                BERRETO agents orchestrate a layered defence across perception, intelligence, and action. Each module is designed to eliminate blind spots while empowering your teams to act faster and smarter.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {capabilityHighlights.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={120} className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-2xl font-semibold text-foreground">Operates across every environment</h3>
              <p className="text-sm text-muted-foreground">
                From luxury residences to critical infrastructure, BERRETO adapts to your risk profile while maintaining a zero-trust security posture.
              </p>
              <ul className="grid grid-cols-2 gap-4 text-sm font-semibold text-primary">
                {sectors.map((sector) => (
                  <li key={sector.label} className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <sector.icon className="h-4 w-4" />
                    {sector.label}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </PageSection>

        <PageSection>
          <div className="space-y-12">
            <div className="max-w-3xl">
              <FadeIn>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Intelligence layers</p>
                <GradientHeading className="mt-4">
                  From perception to action in under a minute
                </GradientHeading>
                <p className="mt-4 text-lg text-foreground">
                  Each BERRETO layer works in concert to surface only what matters and orchestrate the right response.
                </p>
              </FadeIn>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {intelligenceLayers.map((layer, index) => (
                <FadeIn key={layer.title} delay={index * 80} className="flex h-full flex-col rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/10">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <layer.icon className="h-6 w-6" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Layer {index + 1}</span>
                  </div>
                  <h3 className="mt-5 font-headline text-xl font-semibold text-foreground">{layer.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{layer.description}</p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {layer.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              ))}
            </div>
          </div>
        </PageSection>

        <PageSection background="muted" id="journey">
          <FadeIn className="space-y-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Deployment journey</p>
              <GradientHeading className="mt-4">
                Three steps to proactive incident prevention
              </GradientHeading>
              <p className="mt-3 text-lg text-foreground">
                Launch BERRETO without disrupting your existing infrastructure. Our architects guide every phase.
              </p>
            </div>
            <Timeline items={journeySteps} />
          </FadeIn>
        </PageSection>

        <PageSection>
          <div className="grid gap-10 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <FadeIn className="space-y-6">
              <GradientHeading>Command centre that sees ahead</GradientHeading>
              <p className="max-w-2xl text-lg text-foreground">
                Real-time dashboards, predictive analytics, and automated audit trails keep your teams empowered and regulators satisfied.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard label="Threat trends" value="Live" icon={<LineChart className="h-6 w-6" />} />
                <MetricCard label="Incident latency" value="&lt; 60s" icon={<Waves className="h-6 w-6" />} />
                <MetricCard label="Network uptime" value="99.99%" icon={<Radar className="h-6 w-6" />} />
              </div>
              <p className="text-sm text-muted-foreground">
                Every alert is encrypted end-to-end, stored with tamper-proof logs, and ready to share securely with insurers, law enforcement, or internal stakeholders.
              </p>
            </FadeIn>
            <FadeIn delay={120} className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-2xl font-semibold text-foreground">Your recommended starting point</h3>
              {featuredProduct ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {featuredProduct.description ?? "Kickstart proactive security with BERRETO’s most popular device bundle."}
                  </p>
                  <p className="text-2xl font-headline font-semibold text-primary">Rs {featuredProduct.price?.toLocaleString()}</p>
                  <Button
                    className="w-full rounded-full"
                    onClick={handleAddFeatured}
                    disabled={cartItems.some((item) => item.id === featuredProduct.id)}
                  >
                    {cartItems.some((item) => item.id === featuredProduct.id)
                      ? "Added to kit"
                      : "Add to kit"}
                  </Button>
                  <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    View all products
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Configure your command centre with BERRETO hardware and software tuned to your perimeter.
                </p>
              )}
            </FadeIn>
          </div>
        </PageSection>

        <PageSection background="tint" id="pricing">
          <FadeIn className="space-y-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Products & Pricing</p>
              <GradientHeading className="mt-4">
                Choose the deployment that meets your mission
              </GradientHeading>
              <p className="mt-3 text-lg text-foreground">
                Every plan includes encrypted storage, operator training, and human-in-the-loop verification from our Security Operations Centre.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {pricingHighlights.map((plan, index) => (
                <FadeIn key={plan.name} delay={index * 80}>
                  <PricingCard {...plan} />
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </PageSection>

        <PageSection>
          <div className="grid gap-10 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <FadeIn className="space-y-6">
              <GradientHeading>Enterprise support when every second matters</GradientHeading>
              <p className="max-w-2xl text-lg text-foreground">
                Security architects and analysts partner with your teams to design, deploy, and continuously improve BERRETO to fit every perimeter you protect.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">24/7 Security Operations Centre</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Live analysts verify high-risk alerts, call authorities, and coordinate on-site teams.</p>
                    <p>Multi-channel escalation with recorded evidence and bilingual communication.</p>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Security architecture services</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Site audits, policy design, and continuous optimisation to reduce incident volume.</p>
                    <p>Integrations with access control, sirens, drones, and guard management systems.</p>
                  </CardContent>
                </Card>
              </div>
            </FadeIn>
            <FadeIn delay={120} className="rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-2xl font-semibold text-foreground">Ready to accelerate prevention?</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Share your perimeter goals and receive a tailored deployment blueprint within 48 hours.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/contact">Book a strategy session</Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full border border-primary/20 bg-white text-primary hover:bg-primary/10">
                  <Link href="/pre-booking">Pre-book BERRETO hardware</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </PageSection>
      </main>
      <Footer />
      <PageAssistant pageContext="homepage" />
    </div>
  );
}
