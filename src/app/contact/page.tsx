"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Loader2, ShieldAlert, Clock3 } from "lucide-react";
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

export default function ContactPage() {
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const pageContent = await getPageContent("contactpage");
        setContent(pageContent);
      } catch (error) {
        console.error("Failed to fetch contact page content", error);
      }
    }
    fetchContent();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Message sent",
      description: "Thank you for reaching out. Our architects will contact you within one business day.",
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-white to-accent/5" />
          <Container className="grid gap-12 pb-20 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <FadeIn className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Contact BERRETO</p>
              <h1 className="font-headline text-4xl font-semibold tracking-tight sm:text-5xl">
                {content?.hero?.headline ?? "Let’s design a safer future together"}
              </h1>
              <p
                className="max-w-2xl text-lg text-foreground"
                dangerouslySetInnerHTML={{
                  __html:
                    content?.hero?.description ??
                    "Whether you’re planning a new deployment, need technical support, or want a strategic security review, our team is ready to help.",
                }}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="#contact-form">Send a message</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="rounded-full border border-primary/20 bg-white text-primary hover:bg-primary/10">
                  <Link href="tel:+923175812623">Call us directly</Link>
                </Button>
              </div>
            </FadeIn>
            <FadeIn delay={150} className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-xl font-semibold text-foreground">Response time</h3>
              <p className="text-sm text-muted-foreground">
                {content?.details?.supportHours ?? "Support hours: Mon–Sat, 10 AM – 8 PM (PKT)"}
              </p>
              <div className="flex items-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                <Clock3 className="h-5 w-5" /> Our experts typically respond within 24 hours.
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <a href={`mailto:${content?.details?.generalEmail ?? "info@berreto.com"}`} className="hover:text-primary hover:underline">
                    {content?.details?.generalEmail ?? "info@berreto.com"}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{content?.details?.generalPhone ?? "+92 3175812623"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{content?.details?.address ?? "Islamabad, Pakistan"}</span>
                </div>
              </div>
            </FadeIn>
          </Container>
        </section>

        <PageSection>
          <FadeIn className="space-y-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">How we can help</p>
              <GradientHeading className="mt-4">Dedicated specialists for every request</GradientHeading>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-foreground">Security strategy</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Plan rollouts, evaluate risk, and discover how BERRETO fits your security stack.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Tailored threat modelling
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Architecture blueprint workshops
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-foreground">Enterprise sales</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Explore pricing, contracts, and deployment models for your organisation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> sales@berreto.co
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> +92 317 581 2623
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-lg shadow-primary/10">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-foreground">Customer support</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Already using BERRETO? Our support team is on call 24/7.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> help@berreto.com
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> +92 317 581 2623
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </PageSection>

        <PageSection background="muted" id="contact-form">
          <FadeIn className="grid gap-12 lg:grid-cols-5 lg:items-start">
            <div className="lg:col-span-3">
              <Card className="rounded-3xl border border-border/60 bg-white/80 shadow-xl shadow-primary/10">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl text-foreground">Send us a message</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    We typically respond within 24 hours. For urgent incidents, call our security desk.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input id="phone" type="tel" placeholder="(+92) 000 0000000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">How can we help?</Label>
                      <Textarea id="message" placeholder="Tell us about your security goals" rows={5} required />
                    </div>
                    <Button type="submit" className="rounded-full">
                      Submit message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6 rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10">
              <h3 className="font-headline text-2xl font-semibold text-foreground">Visit our office</h3>
              <p className="text-sm text-muted-foreground">
                {content?.details?.address ?? "Office 25, Islamabad, Pakistan"}
              </p>
              <div className="rounded-3xl border border-border/60 bg-primary/5 p-6 text-sm text-primary">
                Connect your cameras to BERRETO and watch how your perimeter transforms from reactive to proactive security in days.
              </div>
              <p className="text-sm text-foreground/60">
                Prefer a live walkthrough? <Link href="/products" className="text-primary underline">Explore our solutions</Link> or book a strategy session.
              </p>
            </div>
          </FadeIn>
        </PageSection>
      </main>
      <Footer />
      <PageAssistant pageContext="contact" />
    </div>
  );
}
