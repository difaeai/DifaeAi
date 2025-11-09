"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";

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
    <footer className="relative mt-24 border-t border-border/60 bg-surface/95 text-text">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-32 bg-gradient-to-b from-primary/20 via-accent/10 to-transparent blur-3xl" />
      <Container className="relative py-16">
        <FadeIn className="relative mx-auto max-w-5xl rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/95 px-8 py-12 text-primary-foreground shadow-2xl shadow-primary/30 sm:px-12">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-foreground/80">
                Don’t Just Record Crime. Prevent It.
              </p>
              <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">
                DIFAE transforms your CCTV into a proactive AI security network.
              </h2>
              <p className="text-sm text-primary-foreground/80">
                Deploy predictive monitoring, autonomous playbooks, and trusted evidence with our security architects at your side.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonPrimary href="/contact">Talk to security architects</ButtonPrimary>
              <ButtonSecondary href="/products">Explore products</ButtonSecondary>
            </div>
          </div>
        </FadeIn>

        <div className="mt-20 grid gap-12 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-headline text-lg text-primary">
                D
              </span>
              <div className="flex flex-col text-sm leading-tight">
                <span className="text-[11px] uppercase tracking-[0.32em] text-primary/70">DIFAE AI</span>
                <span className="text-base font-semibold text-text">Security Cloud</span>
              </div>
            </Link>
            <p className="max-w-md text-sm text-text/70">
              {content?.footer?.tagline ?? "Don't Just Record Crime. Prevent It. Your 24/7 Digital Security Guard."}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              {highlightMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-3xl border border-border/60 bg-white/80 p-4 text-sm text-text/80 shadow-inner shadow-primary/10"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">{metric.label}</p>
                  <p className="mt-2 text-2xl font-headline font-semibold text-text">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-3">
            <FooterColumn title="Platform" links={platformLinks} />
            <FooterColumn title="Solutions" links={solutionLinks} />
            <FooterColumn title="Resources" links={resourceLinks} />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text/60">&copy; {currentYear} BERRETO. All rights reserved.</p>
          <div className="flex items-center gap-4 text-text/60">
            <SocialLink href={content?.footer?.facebookUrl ?? "#"} label="Facebook" icon={Facebook} />
            <SocialLink href={content?.footer?.instagramUrl ?? "#"} label="Instagram" icon={Instagram} />
            <SocialLink href={content?.footer?.linkedinUrl ?? "#"} label="LinkedIn" icon={Linkedin} />
            <SocialLink href={content?.footer?.twitterUrl ?? "#"} label="Twitter" icon={Twitter} />
          </div>
        </div>
      </Container>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  links: { label: string; href: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">{title}</p>
      <ul className="space-y-2 text-sm text-text/70">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition hover:text-text">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SocialLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SocialLink({ href, label, icon: Icon }: SocialLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-text/60 transition hover:border-primary/40 hover:text-primary"
    >
      <Icon className="h-5 w-5" />
    </Link>
  );
}

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
}

function ButtonPrimary({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      {children}
    </Link>
  );
}

function ButtonSecondary({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
    >
      {children}
    </Link>
  );
}
