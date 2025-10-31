
"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Handshake, Lightbulb, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

const values = [
    { icon: <Lightbulb className="h-8 w-8 text-primary" />, title: "Innovation", description: "We are driven by a passion for discovery, constantly pushing the boundaries of what's possible in AI security." },
    { icon: <ShieldCheck className="h-8 w-8 text-primary" />, title: "Integrity", description: "We uphold the highest standards of quality and ethics, ensuring our technology is used responsibly to create a safer world." },
    { icon: <Handshake className="h-8 w-8 text-primary" />, title: "Customer Commitment", description: "Our clients are our partners. We are dedicated to providing security solutions that deliver real, measurable value." },
];

export default function AboutPage() {
    const [content, setContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchContent() {
        try {
            const pageContent = await getPageContent('aboutpage');
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
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                {content?.hero?.headline ?? "About BERRETO"}
              </h1>
              <p className="max-w-[800px] text-muted-foreground md:text-xl" dangerouslySetInnerHTML={{ __html: (content?.hero?.description ?? "We are the creators of the world's first Smart AI Surveillance Agent, the <a href='/agent' class='font-semibold text-primary hover:underline'>DIFAE AI agent</a>, committed to making advanced security accessible to everyone.")}}>
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="w-full py-16 md:py-24">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-1 lg:gap-16 items-center text-center">
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-headline text-secondary-foreground">
                  Our Journey
                </div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                  {content?.story?.headline ?? "From Vision to a Global Service"}
                </h2>
                <p className="text-muted-foreground md:text-lg">
                  {content?.story?.p1 ?? "Started in 2019, BERRETO Pvt Ltd. established itself as a leading Development & Design expert, providing superior Software, Web, and Mobile solutions. Our journey has been driven by a passion for innovation and a commitment to excellence."}
                </p>
                <p className="text-muted-foreground md:text-lg">
                  {content?.story?.p2 ?? "As a company registered and regulated by the Securities and Exchange Commission of Pakistan and recognized by the Pakistan Software Export Board, we uphold the highest standards of quality and integrity. Today, we are proud to channel that expertise into DIFAE AI, our flagship security platform."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="w-full py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid gap-10 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Target className="w-10 h-10 text-primary" />
                    <CardTitle className="font-headline text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: (content?.missionVision?.mission ?? "To deliver superior AI-driven security solutions that provide measurable value and peace of mind. We strive to leverage the most effective use of technology to help organizations and individuals across the globe achieve their safety objectives through our <a href='/products' class='font-semibold text-primary hover:underline'>products</a>.")}}>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Eye className="w-10 h-10 text-primary" />
                    <CardTitle className="font-headline text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {content?.missionVision?.vision ?? "To become a leading force in the global security industry by continuously innovating and introducing impactful AI solutions that contribute to the betterment and safety of society, advancing Pakistan’s position in the global technology landscape."}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-headline text-secondary-foreground">
                            Our Values
                        </div>
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                            The Principles That Guide Us
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           Our core values are the foundation of our culture and the way we do business.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    {values.map((value) => (
                        <div key={value.title} className="text-center space-y-3">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary mx-auto">
                                {value.icon}
                            </div>
                            <h4 className="font-bold font-headline text-xl">{value.title}</h4>
                            <p className="text-sm text-muted-foreground">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA Section */}
         <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                <div className="rounded-lg bg-primary text-primary-foreground p-8 md:p-12 lg:p-16 text-center">
                  <div className="space-y-4">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                      {content?.cta?.headline ?? "Join Us in Building a Safer Future"}
                    </h2>
                    <p className="max-w-2xl mx-auto">
                      {content?.cta?.description ?? "We're always looking for talented individuals to join the BERRETO team. If you're passionate about AI and security, we'd love to hear from you."}
                    </p>
                     <Button asChild size="lg" variant="secondary" className="font-headline mt-4">
                        <Link href="/contact">Get In Touch</Link>
                    </Button>
                  </div>
                </div>
            </div>
        </section>
        <PageAssistant pageContext="This is the About Us page for BERRETO. It tells the story of the company, its mission to make AI security accessible, and introduces the team and company values."/>
      </main>
      <Footer />
    </div>
  );
}
