
"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const highlightMetrics = [
  {
    label: "Incidents triaged",
    value: "7.2K+",
  },
  {
    label: "Avg. alert lead time",
    value: "42 sec",
  },
  {
    label: "Cities monitored",
    value: "35",
  },
  {
    label: "Data encrypted",
    value: "AES-256",
  },
];

const platformLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "DIFAE Agent", href: "/agent" },
  { label: "Contact", href: "/contact" },
];

const solutionLinks = [
  { label: "Security Plans", href: "/products" },
  { label: "DSG Pro Camera", href: "/products" },
  { label: "DSG Vision Camera", href: "/products" },
  { label: "Pre-Booking", href: "/pre-booking" },
];

const resourceLinks = [
  { label: "Support", href: "/contact" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Status Dashboard", href: "#" },
];

async function getPageContent(pageName: string): Promise<any> {
  const docRef = doc(db, "content", pageName);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const pageContent = await getPageContent("global");
        setContent(pageContent);
      } catch (error) {
        console.error("Failed to fetch global content", error);
      }
    }
    fetchContent();
  }, []);

  return (
    <footer className="relative mt-24 border-t border-white/10 bg-[rgba(4,8,20,0.96)] text-white">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-32 bg-gradient-to-b from-primary/40 via-secondary/20 to-transparent blur-3xl" />
      <div className="container relative mx-auto px-6 sm:px-10 lg:px-12">
        <div className="relative -top-12 mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-primary/80 via-secondary/80 to-primary/80 px-6 py-10 text-center text-primary-foreground shadow-2xl shadow-primary/40 sm:px-10">
          <h2 className="text-2xl font-headline font-semibold sm:text-3xl">Design your first autonomous guard post today</h2>
          <p className="mt-3 text-sm text-primary-foreground/80 sm:text-base">
            {content?.footer?.cta ?? "Partner with our security architects to tailor DIFAE to your perimeter, from small storefronts to enterprise campuses."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white/20"
            >
              Talk to an expert
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90"
            >
              Explore plans
            </Link>
          </div>
        </div>

        <div className="grid gap-12 py-16 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 font-headline text-lg text-white">
                B
              </span>
              <div className="flex flex-col text-sm leading-tight">
                <span className="text-xs uppercase tracking-[0.35em] text-white/50">Berreto</span>
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text font-semibold text-transparent">
                  DIFAE AI Security Cloud
                </span>
              </div>
            </Link>
            <p className="max-w-md text-sm text-white/60">
              {content?.footer?.tagline ?? "Don't Just Record Crime. Prevent It. Your 24/7 Digital Security Guard."}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              {highlightMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm shadow-inner shadow-black/20"
                >
                  <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 sm:gap-10 lg:col-span-3">
            <div className="space-y-4">
              <h4 className="font-headline text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Platform</h4>
              <ul className="space-y-2 text-white/70">
                {platformLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-headline text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Solutions</h4>
              <ul className="space-y-2 text-white/70">
                {solutionLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-headline text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Resources</h4>
              <ul className="space-y-2 text-white/70">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-8 text-sm text-white/60">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {currentYear} BERRETO. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href={content?.footer?.facebookUrl ?? "#"} className="transition hover:text-white" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href={content?.footer?.instagramUrl ?? "#"} className="transition hover:text-white" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href={content?.footer?.linkedinUrl ?? "#"} className="transition hover:text-white" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href={content?.footer?.twitterUrl ?? "#"} className="transition hover:text-white" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
