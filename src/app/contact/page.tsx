
"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter, MessageSquare, Loader2 } from "lucide-react";
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

export default function ContactPage() {
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchContent() {
        try {
            const pageContent = await getPageContent('contactpage');
            setContent(pageContent);
        } catch (error) {
            console.error("Failed to fetch page content", error);
        } finally {
            setIsLoading(false);
        }
        }
        fetchContent();
    }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for reaching out. We'll get back to you shortly.",
    });
    (e.target as HTMLFormElement).reset();
  };

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
                {content?.hero?.headline ?? "Contact BERRETO – We’re Here to Help"}
              </h1>
              <p className="max-w-[800px] text-muted-foreground md:text-xl" dangerouslySetInnerHTML={{ __html: (content?.hero?.description ?? "Whether you have a question about DIFAE AI, need technical support for our DSG products, or want to schedule a demo — the BERRETO Team is always ready to assist you. Let’s make your home, office, and community smarter and safer, together.")}}>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods Section */}
        <section className="w-full py-16 md:py-24">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">General Inquiries</CardTitle>
                  <CardDescription>Questions about products, features, or plans?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href={`mailto:${content?.details?.generalEmail ?? 'info@berreto.com'}`} className="hover:underline">{content?.details?.generalEmail ?? 'info@berreto.com'}</a>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{content?.details?.generalPhone ?? '+92 3175812623'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">{content?.details?.supportHours ?? 'Support Hours: Mon–Sat, 10 AM – 8 PM'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Bulk Orders & Sales</CardTitle>
                  <CardDescription>For bulk orders or sales inquiries, please send us a message using the form.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Button asChild variant="outline" className="w-full">
                    <Link href="#contact-form"><MessageSquare className="mr-2 h-4 w-4"/>Send a Message</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Technical Support</CardTitle>
                  <CardDescription>Already a user and need assistance?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{content?.details?.techPhone ?? '+92 3175812623'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href={`mailto:${content?.details?.techEmail ?? 'help@berreto.com'}`} className="hover:underline">{content?.details?.techEmail ?? 'help@berreto.com'}</a>
                  </div>
                  <div className="flex items-center gap-4">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>Live Chat (in dashboard 24/7)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Contact Form & Office Section */}
        <section id="contact-form" className="w-full py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-5">
              <div className="lg:col-span-3">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Send us a Message</CardTitle>
                        <CardDescription>We usually respond within 24 hours. For urgent help, please call us directly.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="Your Name" required />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="your@email.com" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" placeholder="Your Phone Number" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" placeholder="Your message here..." required rows={5} />
                        </div>
                        <Button type="submit" className="w-full font-headline">Submit Message</Button>
                        </form>
                    </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-8">
                 <div className="space-y-4">
                    <h3 className="font-headline text-2xl font-bold">Head Office</h3>
                    <div className="flex items-start gap-4">
                        <MapPin className="h-6 w-6 text-primary mt-1" />
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {content?.details?.address ?? "I-8 Markaz, Islamabad, Pakistan"}
                        </p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h3 className="font-headline text-2xl font-bold">Follow Us</h3>
                    <p className="text-muted-foreground">Stay updated with product news, AI tips, and security advice.</p>
                    <div className="flex gap-4">
                        <Link href="#"><Facebook className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                        <Link href="#"><Instagram className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                        <Link href="#"><Linkedin className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                        <Link href="#"><Twitter className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                    </div>
                 </div>
                 <div className="space-y-4">
                     <h3 className="font-headline text-2xl font-bold">Still Have Questions?</h3>
                     <p className="text-muted-foreground">
                        Check out our DIFAE AI Agent page for answers to common queries about subscriptions, features, camera compatibility, and more.
                     </p>
                     <Button asChild variant="secondary">
                        <Link href="/agent#features">See Agent Features</Link>
                     </Button>
                 </div>
              </div>
            </div>
          </div>
        </section>
        <PageAssistant pageContext="This is the Contact Us page. It provides contact information for general inquiries, sales, and support. It includes a contact form, office address, and links to social media." />
      </main>
      <Footer />
    </div>
  );
}
