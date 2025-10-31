
"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
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

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const pageContent = await getPageContent('global');
        setContent(pageContent);
      } catch (error) {
        console.error("Failed to fetch global content", error);
      }
    }
    fetchContent();
  }, []);

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-6 sm:px-10 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold font-headline">BERRETO</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {content?.footer?.tagline ?? "Don't Just Record Crime. Prevent It. Your 24/7 Digital Security Guard."}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-headline font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/agent" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">DIFAE AI Agent</Link></li>
              <li><Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 3: Products */}
          <div>
            <h4 className="font-headline font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Subscription Plans</Link></li>
              <li><Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">DSG Pro Camera</Link></li>
              <li><Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">DSG Vision Camera</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="font-headline font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {currentYear} BERRETO. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href={content?.footer?.facebookUrl ?? "#"}><Facebook className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" /></Link>
            <Link href={content?.footer?.instagramUrl ?? "#"}><Instagram className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" /></Link>
            <Link href={content?.footer?.linkedinUrl ?? "#"}><Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" /></Link>
            <Link href={content?.footer?.twitterUrl ?? "#"}><Twitter className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
