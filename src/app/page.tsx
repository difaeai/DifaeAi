"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ShieldCheck,
  Bot,
  Video,
  LocateFixed,
  ScanFace,
  ArrowRight,
  Siren,
  Home,
  Building,
  Store,
  Factory,
  Loader2,
  ShoppingCart,
  Phone,
  Check,
} from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PageAssistant } from "@/components/page-assistant";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";

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

const featureHighlights = [
  {
    title: "Predictive Threat Intelligence",
    description:
      "DIFAE watches every pixel for emerging risks, comparing context, movement and intent to predict incidents before they unfold.",
    badge: "Proactive AI",
    icon: ShieldCheck,
    href: "/agent#features",
  },
  {
    title: "Autonomous Response Playbooks",
    description:
      "Escalate to guards, owners or authorities with confidence. DIFAE’s playbooks coordinate calls, sirens and evidence packs automatically.",
    badge: "Autonomous",
    icon: Siren,
    href: "/agent#features",
  },
  {
    title: "Identity & Evidence Engine",
    description:
      "Facial recognition and tamper-proof audit trails build a complete story of every incident for rapid investigations.",
    badge: "Forensics",
    icon: ScanFace,
    href: "/products",
  },
  {
    title: "Unified Perimeter Coverage",
    description:
      "Connect CCTV, IP cameras and new BERRETO devices into one live command centre with end-to-end encryption.",
    badge: "360° Coverage",
    icon: LocateFixed,
    href: "/products",
  },
];

const intelligenceLayers = [
  {
    title: "Situational Awareness Mesh",
    description:
      "Bring every feed, floor plan and safe zone online in minutes. DIFAE calibrates spatial awareness instantly—no new wiring required.",
    points: [
      "Connect legacy CCTV, IP cameras or drone feeds within minutes.",
      "Auto-maps safe zones, blind spots and escalation tiers.",
      "Edge intelligence keeps monitoring alive even if the network drops.",
    ],
    icon: Video,
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
      "Human-verified alerts include video highlights, identity context and recommended actions so you can act decisively.",
    points: [
      "One-tap escalation to owners, guards or emergency services.",
      "Automated call trees with multilingual voice synthesis.",
      "Evidence packages ready for insurers and authorities in seconds.",
    ],
    icon: ShieldCheck,
  },
];

const journeySteps = [
  {
    step: 1,
    title: "Connect your perimeter",
    description:
      "Pair cameras, choose safe zones and define what DIFAE should watch. No rewiring. No hardware lock-in.",
  },
  {
    step: 2,
    title: "Teach DIFAE what matters",
    description:
      "The agent learns your daily rhythm, identifies high-value assets and syncs playbooks across your team.",
  },
  {
    step: 3,
    title: "Receive intelligent briefings",
    description:
      "Stay ahead with prioritized alerts, context-rich video clips and risk scores across every location.",
  },
  {
    step: 4,
    title: "Activate autonomous response",
    description:
      "Authorise DIFAE to coordinate calls, sirens and digital evidence hand-offs the moment a threat escalates.",
  },
];

const industries = [
  { icon: Home, name: "Residential Sanctuaries" },
  { icon: Building, name: "Corporate Campuses" },
  { icon: Store, name: "Retail Networks" },
  { icon: Factory, name: "Industrial Yards" },
];

const partnershipHighlights = [
  "Dedicated mission control specialists verifying every escalation.",
  "SOC2-aligned data handling with geo-fenced storage.",
  "Deployment playbooks tailored to your footprint within 48 hours.",
];

export default function HomePage() {
  const [content, setContent] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    async function fetchData() {
      try {
        const [pageContent, productsData] = await Promise.all([
          getPageContent("homepage"),
          getProducts(),
        ]);
        setContent(pageContent);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to fetch page data", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleBuyNow = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: (product.images && product.images[0]) || "",
    });
    openCart();
  };

  const featuredProduct = useMemo(() => {
    if (products.length === 0) return null;
    return products.find((p) => p.name.toLowerCase().includes("pro")) || products[0];
  }, [products]);

  const otherProducts = useMemo(() => {
    if (!featuredProduct) return products;
    return products.filter((product) => product.id !== featuredProduct.id);
  }, [products, featuredProduct]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const heroHeadline = content?.hero?.headline ?? "World’s First Autonomous AI Security Agent";
  const heroSubHeadline =
    content?.hero?.subHeadline ?? "DIFAE turns every camera into a proactive security partner that predicts, interprets and neutralises threats before they unfold.";
  const heroDescription =
    content?.hero?.description ??
    "Transform passive surveillance into an intelligent response network. DIFAE analyses context, orchestrates response teams and keeps a verifiable record for every incident—without adding new headcount.";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/3 top-[-12rem] h-[26rem] w-[26rem] rounded-full bg-primary/25 blur-[160px]" />
        <div className="absolute right-[-10rem] top-1/4 h-[24rem] w-[24rem] rounded-full bg-secondary/25 blur-[140px]" />
        <div className="absolute bottom-[-8rem] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[160px]" />
      </div>
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-28">
          <div className="container mx-auto grid gap-16 px-6 sm:px-10 lg:px-12 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
                <span>New</span>
                <span className="h-1 w-1 rounded-full bg-primary" />
                <span>Autonomous Security Cloud</span>
              </div>
              <h1 className="font-headline text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
                {heroHeadline}
              </h1>
              <p className="max-w-3xl text-lg text-white/70 sm:text-xl">{heroSubHeadline}</p>
              <p className="max-w-2xl text-base text-white/60 sm:text-lg">{heroDescription}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-12 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30">
                  <Link href="/products">Get DIFAE Today</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/30 bg-white/10 px-8 text-base font-semibold text-white/80 backdrop-blur transition hover:bg-white/20"
                >
                  <Link href="/contact">
                    <Phone className="mr-2 h-4 w-4" /> Book a live command demo
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 pt-6 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/10">
                    <p className="text-3xl font-semibold text-white sm:text-4xl">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-2 shadow-2xl shadow-primary/20 backdrop-blur">
                <div className="overflow-hidden rounded-[2rem] border border-white/5">
                  <iframe
                    className="h-[260px] w-full sm:h-[320px]"
                    src="https://www.youtube.com/embed/9KsJnCt3NVE"
                    title="BERRETO DIFAE AI overview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Live command feed
                  </div>
                  <Link href="/agent#features" className="inline-flex items-center gap-2 text-primary hover:text-primary/90">
                    See how DIFAE thinks <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative pb-20">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="flex flex-col gap-4 text-center">
              <Badge className="mx-auto w-max rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
                {content?.features?.eyebrow ?? "Why security teams upgrade"}
              </Badge>
              <h2 className="font-headline text-3xl font-semibold text-white sm:text-4xl">
                {content?.features?.headline ?? "Everything you need to command a safer perimeter"}
              </h2>
              <p className="mx-auto max-w-3xl text-base text-white/60 sm:text-lg">
                {content?.features?.description ??
                  "DIFAE synthesizes video, audio and behavioural cues to understand your world in real time—and takes action before threats become incidents."}
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featureHighlights.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="group relative overflow-hidden border-white/10 bg-white/5 text-white transition hover:border-primary/60 hover:bg-white/10">
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
                    </div>
                    <CardHeader className="relative space-y-4">
                      <Badge className="w-max rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-white/70">
                        {feature.badge}
                      </Badge>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10">
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="font-headline text-xl text-white">{feature.title}</CardTitle>
                      <CardDescription className="text-sm text-white/70">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Link href={feature.href} className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/90">
                        Discover playbook <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative pb-20">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
              <div className="space-y-5">
                <Badge className="w-max rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
                  {content?.intelligence?.eyebrow ?? "Inside the DIFAE brain"}
                </Badge>
                <h2 className="font-headline text-3xl font-semibold text-white sm:text-4xl">
                  {content?.intelligence?.headline ?? "A neural command centre engineered for resilience"}
                </h2>
                <p className="text-base text-white/60 sm:text-lg">
                  {content?.intelligence?.description ??
                    "From edge processing to evidence archiving, DIFAE synchronises your people, hardware and procedures without compromising privacy."}
                </p>
                <ul className="space-y-3 text-sm text-white/70">
                  {partnershipHighlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {intelligenceLayers.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <div key={layer.title} className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 shadow-lg shadow-black/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-headline text-lg text-white">{layer.title}</h3>
                      </div>
                      <p className="mt-3 text-sm text-white/65">{layer.description}</p>
                      <ul className="mt-4 space-y-2 text-xs text-white/60">
                        {layer.points.map((point) => (
                          <li key={point} className="flex items-start gap-2">
                            <ArrowRight className="mt-0.5 h-3 w-3 text-primary" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="relative pb-20">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="flex flex-col gap-4 text-center">
              <Badge className="mx-auto w-max rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
                {content?.howItWorks?.eyebrow ?? "Mission-ready in days"}
              </Badge>
              <h2 className="font-headline text-3xl font-semibold text-white sm:text-4xl">
                {content?.howItWorks?.headline ?? "How DIFAE deploys across your perimeter"}
              </h2>
              <p className="mx-auto max-w-3xl text-base text-white/60 sm:text-lg">
                {content?.howItWorks?.description ??
                  "Our customer success engineers orchestrate every step with you—so your team stays focused on the mission while DIFAE guards the ground."}
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {journeySteps.map((step) => (
                <div key={step.step} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-sm text-white/70 shadow-lg shadow-black/20">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold text-white">
                      {step.step}
                    </span>
                    <h3 className="font-headline text-xl text-white">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-white/65">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative pb-20">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="flex flex-col gap-4 text-center">
              <Badge className="mx-auto w-max rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
                {content?.useCases?.eyebrow ?? "Where DIFAE stands watch"}
              </Badge>
              <h2 className="font-headline text-3xl font-semibold text-white sm:text-4xl">
                {content?.useCases?.headline ?? "From neighbourhood streets to nationwide fleets"}
              </h2>
              <p className="mx-auto max-w-3xl text-base text-white/60 sm:text-lg">
                {content?.useCases?.description ??
                  "Tailored risk models keep homes, operations and public spaces safe—no matter how complex the layout or crowd."}
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {industries.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div key={useCase.name} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white transition hover:border-primary/60 hover:bg-white/10">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 font-headline text-lg">{useCase.name}</h3>
                    <p className="mt-2 text-sm text-white/60">
                      Bespoke alert rules, geo-fencing and escalation trees tuned to your footprint.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {featuredProduct && (
          <section className="relative pb-24" id="products">
            <div className="container mx-auto px-6 sm:px-10 lg:px-12">
              <div className="flex flex-col gap-4 text-center">
                <Badge className="mx-auto w-max rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
                  {content?.products?.eyebrow ?? "Hardware + AI"}
                </Badge>
                <h2 className="font-headline text-3xl font-semibold text-white sm:text-4xl">
                  {content?.products?.headline ?? "Choose the kit that meets your mission"}
                </h2>
                <p className="mx-auto max-w-3xl text-base text-white/60 sm:text-lg">
                  {content?.products?.description ??
                    "Pair DIFAE subscriptions with BERRETO’s intelligent camera hardware or plug into your existing ecosystem."}
                </p>
              </div>
              <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
                <Card className="relative overflow-hidden border-white/10 bg-white/5 text-white shadow-2xl shadow-primary/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
                  <div className="relative grid gap-6 p-8 sm:grid-cols-2">
                    <div className="space-y-4">
                      <Badge className="w-max rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-white/70">
                        Flagship
                      </Badge>
                      <CardTitle className="font-headline text-3xl text-white">{featuredProduct.title}</CardTitle>
                      <CardDescription className="text-base text-white/70">
                        {featuredProduct.description}
                      </CardDescription>
                      <p className="text-2xl font-semibold text-white">
                        Rs {featuredProduct.price.toLocaleString()}
                        <span className="ml-2 text-sm font-normal text-white/60">{featuredProduct.priceDescription}</span>
                      </p>
                      <ul className="space-y-2 text-sm text-white/70">
                        {featuredProduct.features.slice(0, 4).map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-1 h-4 w-4 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        <Button
                          className="h-11 flex-1 rounded-full bg-gradient-to-r from-primary via-secondary to-accent text-sm font-semibold text-primary-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            handleBuyNow(featuredProduct);
                          }}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" /> Add to security stack
                        </Button>
                        <Button asChild variant="outline" className="h-11 flex-1 rounded-full border-white/30 bg-white/10 text-sm font-semibold text-white">
                          <Link href={`/products/${featuredProduct.id}`}>View product brief</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      {featuredProduct.images && featuredProduct.images.length > 0 ? (
                        <Carousel className="relative w-full">
                          <CarouselContent>
                            {featuredProduct.images.map((image, index) => (
                              <CarouselItem key={image}>
                                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10">
                                  <Image
                                    src={image}
                                    alt={`${featuredProduct.title} image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          {featuredProduct.images.length > 1 && (
                            <>
                              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 border-white/20 bg-white/10 text-white hover:bg-white/20" />
                              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 border-white/20 bg-white/10 text-white hover:bg-white/20" />
                            </>
                          )}
                        </Carousel>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                          <Video className="h-10 w-10 text-white/60" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
                {otherProducts.length > 0 && (
                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
                    <h3 className="font-headline text-xl text-white">More ways to deploy DIFAE</h3>
                    <p className="mt-2 text-sm text-white/60">
                      Mix and match subscriptions, cameras and services to design the exact coverage you need.
                    </p>
                    <Carousel className="mt-6">
                      <CarouselContent>
                        {otherProducts.map((product) => (
                          <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-full">
                            <Link href={`/products/${product.id}`} className="block">
                              <Card className="relative h-full overflow-hidden border-white/10 bg-white/5 text-white transition hover:border-primary/60 hover:bg-white/10">
                                <CardHeader className="space-y-3">
                                  <CardTitle className="font-headline text-lg">{product.title}</CardTitle>
                                  <CardDescription className="text-sm text-white/70">{product.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <p className="text-xl font-semibold text-white">
                                    Rs {product.price.toLocaleString()}
                                    <span className="ml-2 text-xs font-normal text-white/60">{product.priceDescription}</span>
                                  </p>
                                  <ul className="space-y-1 text-xs text-white/60">
                                    {product.features.slice(0, 3).map((feature) => (
                                      <li key={feature} className="flex items-start gap-2">
                                        <Check className="mt-1 h-3 w-3 text-primary" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <Button
                                    className="w-full rounded-full bg-white/10 text-sm font-semibold text-white"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleBuyNow(product);
                                    }}
                                  >
                                    Add to plan
                                  </Button>
                                </CardContent>
                              </Card>
                            </Link>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {otherProducts.length > 1 && (
                        <>
                          <CarouselPrevious className="-left-5 border-white/20 bg-white/10 text-white hover:bg-white/20" />
                          <CarouselNext className="-right-5 border-white/20 bg-white/10 text-white hover:bg-white/20" />
                        </>
                      )}
                    </Carousel>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="relative pb-24">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
              <div className="space-y-5">
                <Badge className="w-max rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
                  {content?.trust?.eyebrow ?? "Proof in every alert"}
                </Badge>
                <h2 className="font-headline text-3xl font-semibold text-white sm:text-4xl">
                  {content?.trust?.headline ?? "Every notification arrives with context, evidence and a plan"}
                </h2>
                <p className="text-base text-white/60 sm:text-lg">
                  {content?.trust?.description ??
                    "Ops teams, emergency services and insurers trust DIFAE’s telemetry to act fast and close cases with confidence."}
                </p>
                <ul className="space-y-3 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    Dynamic briefing cards summarise the who, what and where of every incident.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    Secure evidence vault keeps footage tamper-proof for compliance and claims.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    Operator annotations sync instantly across command centres, mobile and wearable devices.
                  </li>
                </ul>
              </div>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-headline text-lg text-white">24/7 Mission Control</h3>
                    <p className="text-sm text-white/65">
                      Our specialists audit every high-priority alert before it reaches your phone. Humans remain in the loop so you always know what matters.
                    </p>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-white/60">
                      <p className="font-semibold text-white">Command Snapshot</p>
                      <ul className="mt-2 space-y-2">
                        <li className="flex items-center justify-between">
                          <span>Active incidents</span>
                          <span className="text-emerald-400">3 live</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Agents on duty</span>
                          <span>12</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Average response</span>
                          <span>42 sec</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-headline text-lg text-white">Evidence Vault</h3>
                    <p className="text-sm text-white/65">
                      Every alert includes the footage, transcripts and checklists you need for rapid resolutions and long-term analytics.
                    </p>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-white/60">
                      <p className="font-semibold text-white">Latest escalation package</p>
                      <ul className="mt-2 space-y-2">
                        <li className="flex items-center justify-between">
                          <span>Status</span>
                          <span className="text-amber-300">Awaiting owner approval</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Evidence length</span>
                          <span>38 seconds</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Secure share</span>
                          <span>Enabled</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative pb-24">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 px-8 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/30 sm:px-16">
              <h2 className="font-headline text-3xl font-semibold sm:text-4xl">
                {content?.cta?.headline ?? "Ready to deploy DIFAE across your perimeter?"}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">
                {content?.cta?.description ??
                  "Start with a tailored perimeter review and discover how autonomous response changes the security playbook for good."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="h-12 rounded-full bg-white px-8 text-base font-semibold text-slate-900 shadow-lg shadow-primary/30">
                  <Link href="/signup">Launch DIFAE</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-white/10 px-8 text-base font-semibold text-primary-foreground">
                  <Link href="/about">Meet the BERRETO team</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <PageAssistant pageContext="This is the redesigned BERRETO homepage showcasing DIFAE, an autonomous AI security platform. It highlights predictive threat detection, autonomous response playbooks, product offerings, deployment journey, and mission control support." />
      </main>
      <Footer />
    </div>
  );
}
