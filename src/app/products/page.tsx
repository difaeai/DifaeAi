

"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShoppingCart, Loader2, Video, X } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { PageAssistant } from "@/components/page-assistant";
import { Product } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getProducts(): Promise<Product[]> {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy("price"));
    const productsSnapshot = await getDocs(q);
    if (productsSnapshot.empty) return [];
    return productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export default function ProductsPage() {
  const { addToCart, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleBuyNow = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id: product.id, name: product.name, price: product.price, image: (product.images && product.images[0]) || '' });
    openCart();
  }
  
  const basicPlan = products.find(p => p.name.toLowerCase().includes('agent'));
  const proPlan = products.find(p => p.name.toLowerCase().includes('pro'));
  const visionPlan = products.find(p => p.name.toLowerCase().includes('vision'));

  const featureGroups = [
    {
        category: 'Core AI Capabilities',
        features: [
            { name: "Real-time monitoring and AI precision", basic: true, pro: true, vision: true },
            { name: "Instant notifications for unusual events", basic: true, pro: true, vision: true },
            { name: "Smart adaptive learning for personalized use", basic: true, pro: true, vision: true },
        ]
    },
    {
        category: 'Advanced Detection',
        features: [
            { name: "Vehicle security and theft prevention", basic: true, pro: true, vision: true },
            { name: "Unauthorized person detection and alerts", basic: true, pro: true, vision: true },
            { name: "Gun, fire, smoke, and prohibited activity detection", basic: true, pro: true, vision: true },
        ]
    },
    {
        category: 'Specialized Features',
        features: [
            { name: "Network trace for stolen vehicle tracking", basic: false, pro: true, vision: true },
            { name: "AI model can be trained based on your SOPs", basic: false, pro: false, vision: true },
            { name: "Employee behavior and performance monitoring", basic: false, pro: false, vision: true },
            { name: "Client and visitor behavior analysis", basic: false, pro: false, vision: true },
            { name: "Patient or student activity tracking", basic: false, pro: false, vision: true },
        ]
    },
    {
        category: 'Hardware & Reporting',
        features: [
            { name: "Automated daily event PDF report with screenshots", basic: true, pro: true, vision: true },
            { name: "Real-time deviation alerts and reporting", basic: false, pro: true, vision: true },
            { name: "AI Cyber Shield for digital protection", basic: false, pro: false, vision: true },
        ]
    }
];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 bg-secondary">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                BERRETO Products – Choose Your Smart Security Solution
              </h1>
              <p className="max-w-[800px] text-muted-foreground md:text-xl">
                Enhance your existing CCTV setup with our <Link href="/agent" className="font-semibold text-primary hover:underline">DIFAE AI agent</Link> or select our advanced
                AI-ready cameras. We have the perfect solution for every
                security need.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
            ) : products.length > 0 ? (
                <div className="space-y-20">
                {products.map((product, index) => {
                    const displayFeatures = index === 1
                        ? [
                            "AI model can be trained based on your SOPs",
                            "Employee behavior and performance monitoring",
                            "Client and visitor behavior analysis",
                            "Patient or student activity tracking",
                            "Smart adaptive learning for personalized use"
                          ] 
                        : product.features;

                    return (
                        <Link key={product.id} href={`/products/${product.id}`} className="block group">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className={cn("order-1", index % 2 === 1 && "lg:order-2")}>
                                        <div className="aspect-video relative rounded-xl shadow-2xl overflow-hidden">
                                            {product.images && product.images.length > 0 ? (
                                                <Image src={product.images[0]} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={product.hints.join(" ")}/>
                                            ) : (
                                                <div className="bg-muted flex items-center justify-center h-full w-full">
                                                    <Video className="w-16 h-16 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                </div>
                                <div className={cn("order-2 flex flex-col items-start", index % 2 === 1 && "lg:order-1")}>
                                    <h2 className="font-headline text-3xl md:text-4xl font-bold">{product.title}</h2>
                                    <p className="mt-4 text-lg text-muted-foreground">{product.longDescription}</p>
                                    <ul className="mt-6 space-y-3">
                                        {displayFeatures.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                                        <p className="text-4xl font-bold font-headline whitespace-nowrap">Rs {product.price.toLocaleString()}<span className="text-lg font-medium text-muted-foreground">{product.priceDescription}</span></p>
                                        <div className="flex w-full gap-2">
                                            <Button size="lg" className="w-full" onClick={(e) => handleBuyNow(e, product)}>
                                                <ShoppingCart className="mr-2 h-5 w-5" />
                                                {product.primaryActionText}
                                            </Button>
                                             <Button size="lg" variant="outline" asChild>
                                                <Link href={`/products/${product.id}`}>Learn More</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
                </div>
            ) : (
                <Card className="text-center p-12">
                    <h2 className="text-2xl font-bold font-headline">No Products Available</h2>
                    <p className="text-muted-foreground mt-2">
                        Products are being updated. Please check back soon or contact the site administrator.
                    </p>
                </Card>
            )}
          </div>
        </section>

        <section id="compare" className="w-full py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-6 sm:px-10 lg:px-12">
            <div className="flex flex-col items-center space-y-4 text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Compare Our Subscription Plans</h2>
            </div>
            
             <Card className="overflow-x-auto">
                 <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%] text-xl font-headline font-bold">Features</TableHead>
                             {[
                                { title: 'DIFAE AI Agent', plan: basicPlan, popular: false },
                                { title: 'DSG Pro', plan: proPlan, popular: true },
                                { title: 'DSG Vision', plan: visionPlan, popular: false },
                            ].map(({ title, plan, popular }) => (
                                <TableHead key={title} className={cn("text-center w-[20%]", popular ? "bg-primary/5" : "")}>
                                    {popular && <div className="text-xs font-bold text-primary mb-2">MOST POPULAR</div>}
                                    <h3 className="text-xl font-headline font-bold">{title}</h3>
                                    {plan && <p className="text-lg font-semibold">Rs {plan.price.toLocaleString()}{plan.priceDescription}</p>}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {featureGroups.map((group, groupIndex) => (
                             <React.Fragment key={group.category}>
                                <TableRow>
                                    <TableCell colSpan={4} className="font-bold text-lg bg-muted/50">{group.category}</TableCell>
                                </TableRow>
                                {group.features.map((feature, featureIndex) => (
                                     <TableRow key={feature.name}>
                                        <TableCell>{feature.name}</TableCell>
                                        <TableCell className="text-center">{feature.basic ? <Check className="h-5 w-5 text-green-500 inline-block" /> : <X className="h-5 w-5 text-muted-foreground inline-block" />}</TableCell>
                                        <TableCell className="text-center bg-primary/5">{feature.pro ? <Check className="h-5 w-5 text-green-500 inline-block" /> : <X className="h-5 w-5 text-muted-foreground inline-block" />}</TableCell>
                                        <TableCell className="text-center">{feature.vision ? <Check className="h-5 w-5 text-green-500 inline-block" /> : <X className="h-5 w-5 text-muted-foreground inline-block" />}</TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                         <TableRow>
                            <TableCell></TableCell>
                             {[
                                { plan: basicPlan, variant: 'outline' as const },
                                { plan: proPlan, variant: 'default' as const },
                                { plan: visionPlan, variant: 'outline' as const },
                              ].map(({ plan, variant }, index) => (
                                 <TableCell key={index} className={cn("text-center p-4", index === 1 ? "bg-primary/5" : "")}>
                                    {plan && <Button className="w-full" variant={variant} onClick={(e) => handleBuyNow(e, plan)}>Buy Now</Button>}
                                 </TableCell>
                              ))}
                         </TableRow>
                    </TableBody>
                 </Table>
            </Card>
          </div>
        </section>


        <PageAssistant pageContext="This is the Products page. It details the main offerings: the DIFAE AI Agent subscription for existing cameras, the BERRETO DSG Pro camera with theft detection, and the BERRETO DSG Vision camera with facial recognition. It includes pricing and a feature comparison table. Help the user choose the best product for their needs." />
      </main>
      <Footer />
    </div>
  );
}
