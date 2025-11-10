"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ShieldAlert, Radar, Siren, Clock3 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { PageAssistant } from "@/components/page-assistant";
import { Product } from "@/lib/types";
import React, { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Image from "next/image";
import { PageSection } from "@/components/ui/page-section";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { Container } from "@/components/ui/container";
import { PricingCard } from "@/components/ui/pricing-card";

async function getProducts(): Promise<Product[]> {
  const productsCollection = collection(db, "products");
  const q = query(productsCollection, orderBy("price"));
  const productsSnapshot = await getDocs(q);
  if (productsSnapshot.empty) return [];
  return productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
}

const differentiators = [
  {
    icon: ShieldAlert,
    title: "Human-verified AI alerts",
    description: "Every high-risk escalation is reviewed by trained analysts before it reaches your team.",
  },
  {
    icon: Radar,
    title: "Predictive insights",
    description: "Understand emerging risk hotspots and adjust guard coverage with confidence.",
  },
  {
    icon: Siren,
    title: "Autonomous playbooks",
    description: "Trigger sirens, speaker announcements, and authority calls automatically when thresholds are met.",
  },
  {
    icon: Clock3,
    title: "Rapid deployment",
    description: "Activate BERRETO within days using existing cameras, no rewiring required.",
  },
];

export default function ProductsPage() {
  const { addToCart, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await getProducts();
        setProducts(response);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const subscriptionPlans = useMemo(
    () => products.filter((product) => product.subscription && product.subscription.trim() !== ""),
    [products],
  );

  const hardwareBundles = useMemo(
    () => products.filter((product) => !product.subscription || product.subscription.trim() === ""),
    [products],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-white to-accent/5" />
          <Container className="grid gap-12 pb-20 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <FadeIn className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Products & Pricing</p>
              <h1 className="font-headline text-4xl font-semibold tracking-tight sm:text-5xl">
                Choose the BERRETO deployment built for your perimeter
              </h1>
              <p className="max-w-2xl text-lg text-foreground">
                Whether you’re safeguarding a single estate or a national footprint, BERRETO combines AI, human expertise, and trusted hardware to stop incidents before they escalate.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {!isLoading && subscriptionPlans.length > 0 && (
                  <Button asChild size="lg" className="rounded-full">
                    <Link href="#plans">Compare plans</Link>
                  </Button>
                )}
                <Button asChild size="lg" variant={!isLoading && subscriptionPlans.length > 0 ? "secondary" : "default"} className="rounded-full border border-primary/20 bg-white text-primary hover:bg-primary/10">
                  <Link href="/contact">Talk to sales</Link>
                </Button>
              </div>
            </FadeIn>
            <FadeIn delay={150} className="rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-xl font-semibold text-foreground">Every plan includes</h3>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Predictive analytics tuned to your sites
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Human-verified alerting 24/7
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Secure incident evidence vault
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Dedicated onboarding specialists
                </li>
              </ul>
            </FadeIn>
          </Container>
        </section>

        <PageSection>
          <FadeIn className="space-y-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Why teams choose BERRETO</p>
              <GradientHeading className="mt-4">Premium technology backed by human expertise</GradientHeading>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {differentiators.map((item, index) => (
                <FadeIn key={item.title} delay={index * 80} className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/10">
                  <item.icon className="h-10 w-10 text-primary" />
                  <h3 className="mt-6 font-headline text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </PageSection>

        {(isLoading || subscriptionPlans.length > 0) && (
          <PageSection background="tint" id="plans">
            <FadeIn className="space-y-10">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Managed plans</p>
                <GradientHeading className="mt-4">Managed AI security tuned to your mission</GradientHeading>
                <p className="mt-3 text-lg text-foreground">
                  Subscription plans combine BERRETO software, SOC analysts, and proactive reporting tailored to your risk profile.
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {subscriptionPlans.map((plan, index) => (
                    <FadeIn key={plan.id} delay={index * 80}>
                      <PricingCard
                        name={plan.name}
                        price={`Rs ${plan.price?.toLocaleString()}${plan.priceDescription || ''}`}
                        description={plan.description || ''}
                        features={Array.isArray(plan.features) ? plan.features : []}
                        ctaLabel={plan.primaryActionText || 'Get started'}
                        ctaHref="/contact"
                      />
                    </FadeIn>
                  ))}
                </div>
              )}
            </FadeIn>
          </PageSection>
        )}


        {(isLoading || hardwareBundles.length > 0) && (
          <PageSection background="muted">
            <FadeIn className="space-y-10">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Hardware</p>
                <GradientHeading className="mt-4">Precision hardware engineered for BERRETO</GradientHeading>
                <p className="mt-3 text-lg text-foreground">
                  Pair BERRETO software with premium cameras, edge processors, and sensors purpose-built to capture critical evidence.
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {hardwareBundles.map((product) => {
                    const primaryImage = product.images?.[0];
                    return (
                      <Card
                        key={product.id}
                        className="group flex h-full flex-col rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10 transition hover:-translate-y-1 hover:shadow-xl"
                      >
                      {primaryImage && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
                          <Image src={primaryImage} alt={product.name} fill className="object-cover" />
                        </div>
                      )}
                      <CardHeader className="space-y-2">
                        <CardTitle className="text-xl font-semibold text-foreground">{product.name}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto space-y-3 text-sm text-muted-foreground">
                        <p className="text-lg font-headline text-primary">Rs {product.price?.toLocaleString()}</p>
                        {product.features && Array.isArray(product.features) && (
                          <ul className="space-y-2">
                            {product.features.map((feature: string) => (
                              <li key={feature} className="flex items-start gap-2">
                                <Check className="mt-1 h-4 w-4 text-success" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                      <CardFooter className="mt-4">
                        <Button
                          className="w-full rounded-full"
                          onClick={() => {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price ?? 0,
                              image: product.images?.[0] ?? "",
                            });
                            openCart();
                          }}
                        >
                          Add to kit
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                  })}
                </div>
              )}
            </FadeIn>
          </PageSection>
        )}

        <PageSection>
          <FadeIn className="grid gap-10 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <div className="space-y-6">
              <GradientHeading>Let’s design your security blueprint</GradientHeading>
              <p className="max-w-2xl text-lg text-foreground">
                Our architects will evaluate your perimeter and recommend the right blend of AI, human operations, and hardware to meet your mission goals.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full">
                  <Link href="/contact">Book a demo</Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full border border-primary/20 bg-white text-primary hover:bg-primary/10">
                  <Link href="/pre-booking">Pre-book BERRETO hardware</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-2xl font-semibold text-foreground">Need help choosing?</h3>
              <p className="text-sm text-muted-foreground">
                Email <Link href="mailto:hello@berreto.co" className="text-primary underline">hello@berreto.co</Link> and our team will respond within one business day.
              </p>
            </div>
          </FadeIn>
        </PageSection>
      </main>
      <Footer />
      <PageAssistant pageContext="products" />
    </div>
  );
}
