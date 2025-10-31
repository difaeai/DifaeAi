
"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Bot,
  CarFront,
  Flame,
  ScanFace,
  FileText,
  ShoppingCart,
  Phone,
  Loader2,
  ShieldAlert,
  Siren,
  Network,
  Users,
  AlertOctagon,
  BrainCircuit,
  Server
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageAssistant } from "@/components/page-assistant";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getPageContent(pageName: string): Promise<any> {
    const docRef = doc(db, 'content', pageName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

const keyFeatures = [
    {
        icon: <ShieldAlert className="h-8 w-8 text-primary" />,
        title: "AI-Powered Theft Protection",
        description: "DIFAE detects intruders, prevents theft attempts, and helps you track stolen vehicles with precision through connected cameras across the DIFAE network.",
    },
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: "Human Recognition via Social Media Intelligence",
        description: "Using a custom AI API, DIFAE recognizes faces by cross-verifying with public social media data — enhancing identification accuracy for both known and unknown individuals.",
    },
    {
        icon: <AlertOctagon className="h-8 w-8 text-primary" />,
        title: "Unauthorized Access Alerts",
        description: "If there’s someone you don’t want near your home or workplace, simply upload their picture. DIFAE immediately alerts you the moment that person appears on any connected camera.",
    },
    {
        icon: <Flame className="h-8 w-8 text-primary" />,
        title: "Gun, Fire, and Smoke Detection",
        description: "DIFAE instantly identifies firearms, fire, or smoke — alerting you within seconds and helping you respond before any harm occurs.",
    },
    {
        icon: <FileText className="h-8 w-8 text-primary" />,
        title: "Event-Based PDF Reporting",
        description: "Get a detailed daily report in PDF format, summarizing all detected events with screenshots and timestamps — allowing you to review an entire day’s security activity in just one minute.",
    },
    {
        icon: <Network className="h-8 w-8 text-primary" />,
        title: "Smart Network Trace",
        description: "If your vehicle or any object is stolen, DIFAE traces its last known location through its connected camera network, providing you with real-time tracking assistance.",
    },
    {
        icon: <Server className="h-8 w-8 text-primary" />,
        title: "AI Cyber Shield",
        description: "DIFAE not only protects your physical surroundings but also safeguards your phone and network from phishing, hacking, and digital intrusions — securing every layer of your life.",
    },
    {
        icon: <BrainCircuit className="h-8 w-8 text-primary" />,
        title: "Supervised Learning & Continuous Improvement",
        description: "With every detection and user interaction, DIFAE’s intelligence grows stronger, adapting to your environment and making its predictions sharper with time.",
    },
];

const benefits = [
    { name: "Predicts threats before they happen" },
    { name: "24/7 protection for home, office, and vehicle" },
    { name: "Instant alerts for physical and cyber threats" },
    { name: "Automated daily reporting for quick reviews" },
    { name: "Compatible with existing CCTV networks" },
    { name: "Reduces emergency response time to seconds" },
    { name: "Fully AI-driven, private, and secure" },
];

export default function AgentPage() {
    const [content, setContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchContent() {
        try {
            const pageContent = await getPageContent('agentpage');
            setContent(pageContent);
        } catch (error) {
            console.error("Failed to fetch page content", error);
        } finally {
            setIsLoading(false);
        }
        }
        fetchContent();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        );
    }
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 bg-secondary">
          <div className="container mx-auto px-6 md:px-10 lg:px-12 text-center">
             <Bot className="mx-auto h-16 w-16 text-primary mb-6" />
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
              {content?.hero?.headline ?? "About DIFAE AI"}
            </h1>
            <p className="max-w-3xl mx-auto mt-6 text-muted-foreground md:text-xl">
              {content?.hero?.description ?? "DIFAE AI is the world’s first Smart Surveillance Agent that merges artificial intelligence, machine learning, and real-time analytics to protect individuals and organizations from evolving threats. It doesn’t just react — it anticipates danger. From theft prevention to cyber protection, DIFAE gives you a complete security ecosystem that thinks and acts faster than any human guard."}
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-16 md:py-24">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
             <div className="grid gap-10 lg:grid-cols-1 items-center text-center">
                <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-headline text-secondary-foreground">
                        Our Mission
                    </div>
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Anticipating Danger. Ensuring Safety.</h2>
                    <p className="text-muted-foreground md:text-lg">
                        {content?.howItWorks?.description ?? "Whether it’s your home, office, or vehicle, DIFAE ensures safety by continuously learning from activity patterns, identifying anomalies, and alerting you before the threat becomes reality."}
                    </p>
                </div>
            </div>
          </div>
        </section>
        
        {/* Key Features Section */}
        <section id="features" className="w-full py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                <div className="text-center mb-12">
                    <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-headline text-muted-foreground mb-2">
                        Key Features
                    </div>
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">A Complete Security Ecosystem</h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {(content?.keyFeatures ?? keyFeatures).map((feature: any) => (
                        <Card key={feature.title} className="flex flex-col overflow-hidden group transition-shadow hover:shadow-xl bg-background">
                            <CardHeader>
                                {feature.icon ?? <ShieldAlert className="h-8 w-8 text-primary" />}
                                <CardTitle className="font-headline mt-2">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Benefits Table Section */}
        <section id="compare" className="w-full py-16 md:py-24">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                <div className="flex flex-col items-center space-y-4 text-center mb-12">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-headline text-secondary-foreground mb-2">
                        Advantages
                    </div>
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose DIFAE</h2>
                </div>
                <Card>
                    <Table>
                        <TableBody>
                           {(content?.whyChoose ?? benefits).map((benefit: { name: string }) => (
                             <TableRow key={benefit.name}>
                                <TableCell className="font-medium text-center md:text-left text-lg">{benefit.name}</TableCell>
                            </TableRow>
                           ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </section>

        {/* Vision 2 Section */}
         <section className="w-full py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                 <div className="relative text-center p-8 md:p-12 lg:p-16 rounded-2xl overflow-hidden bg-background">
                    <div className="relative z-10 space-y-4">
                        <div className="inline-block rounded-lg bg-muted text-muted-foreground px-3 py-1 text-sm font-headline mb-2">
                            Coming Soon
                        </div>
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">{content?.vision2?.headline ?? "Vision 2 – The Next Generation of DIFAE Security"}</h2>
                        <p className="max-w-3xl mx-auto text-muted-foreground md:text-lg">
                            {content?.vision2?.description ?? "Vision 2 is DIFAE’s latest innovation — a portable, AI-powered camera designed to protect your car and property with intelligent tracking. If your car is stolen, Vision 2 scans the DIFAE network to locate its last known position. It also detects gunfire, fire, and smoke, and sends you instant alerts — ensuring your safety without constant monitoring. Vision 2 gives you a complete event report every 24 hours, letting you review your surroundings in just one minute — so you can finally rest with peace of mind."}
                        </p>
                        <p className="font-semibold text-primary">{content?.vision2?.availability ?? "Limited units available — book yours today."}</p>
                    </div>
                 </div>
            </div>
        </section>


        {/* Lifesaving Section */}
        <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="container mx-auto px-6 md:px-10 lg:px-12 text-center">
                 <Siren className="mx-auto h-16 w-16 mb-4" />
                 <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Trigger Police Authorities in Real-Time</h2>
                 <blockquote className="max-w-3xl mx-auto mt-6 text-xl italic">
                    “In a high-priority situation, a single tap can be the difference. The DIFAE AI agent empowers you to alert the police automatically, sending critical information for a faster, more effective response.”
                 </blockquote>
                 <p className="mt-4 font-semibold text-lg">Don't just be a witness. Be the one who acts.</p>
            </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24">
             <div className="container mx-auto px-6 md:px-10 lg:px-12 text-center">
                 <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Make Your Home Smart. Make It Safe.</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">The future of security isn’t hardware. It’s intelligent software from BERRETO.</p>
                 <div className="flex justify-center flex-wrap gap-4 mt-8">
                     <Button asChild size="lg">
                        <Link href="/products"><ShoppingCart className="mr-2"/> Explore Subscription Plans</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href="/contact"><Phone className="mr-2"/> Book a Demo</Link>
                    </Button>
                 </div>
            </div>
        </section>
        <PageAssistant pageContext="This is the page for the DIFAE AI Agent, the core AI technology. It explains in detail how the agent works, its daily life use cases like vehicle security and fire detection, and the benefits of its proactive monitoring." />
      </main>
      <Footer />
    </div>
  );
}
