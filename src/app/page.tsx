
"use client";

import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldCheck,
  Bot,
  Video,
  CarFront,
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
  Check
} from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PageAssistant } from "@/components/page-assistant";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";

async function getPageContent(pageName: string): Promise<any> {
    const docRef = doc(db, 'content', pageName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

async function getProducts(): Promise<Product[]> {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy("name"));
    const productsSnapshot = await getDocs(q);
    if (productsSnapshot.empty) return [];
    return productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

const features = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Real-Time Threat Detection",
    description: "Our AI doesn't just record—it analyzes. It identifies potential threats like suspicious individuals, weapons, or fire hazards in real-time.",
    link: "/agent#features",
  },
  {
    icon: <CarFront className="h-10 w-10 text-primary" />,
    title: "Smart Theft Alerts",
    description: "Protect your vehicles and valuables. The DIFAE agent learns what's important and alerts you instantly if they're moved from their designated safe zone.",
    link: "/products",
  },
  {
    icon: <ScanFace className="h-10 w-10 text-primary" />,
    title: "Facial Recognition",
    description: "With our DSG Vision plan, identify who is on your property. Get valuable intelligence and an unprecedented level of security.",
    link: "/products",
  },
];

const howItWorks = [
    {
        step: 1,
        title: "Connect Your Cameras",
        description: "Easily connect your existing CCTV or IP cameras to the BERRETO platform. Our system is compatible with most standard devices."
    },
    {
        step: 2,
        title: "Activate the DIFAE AI",
        description: "Our powerful AI agent begins learning your environment, establishing a baseline for normal activity and defining your virtual 'Safe Zone'."
    },
    {
        step: 3,
        title: "Receive Intelligent Alerts",
        description: "The agent monitors your feeds 24/7. When a real threat is detected, you get an instant, actionable alert on your device."
    },
     {
        step: 4,
        title: "Trigger an Emergency Response",
        description: "For high-priority threats, you can authorize the DIFAE agent to automatically contact local law enforcement with critical information."
    }
];

const useCases = [
    { icon: <Home className="h-8 w-8" />, name: "Residential" },
    { icon: <Building className="h-8 w-8" />, name: "Offices" },
    { icon: <Store className="h-8 w-8" />, name: "Retail" },
    { icon: <Factory className="h-8 w-8" />, name: "Industrial" }
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
          getPageContent('homepage'),
          getProducts()
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
    addToCart({ id: product.id, name: product.name, price: product.price, image: (product.images && product.images[0]) || '' });
    openCart();
  }

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  const featuredProduct = products.length > 0 ? products.find(p => p.name.toLowerCase().includes('pro')) || products[0] : null;
  const otherProducts = products.filter(p => p.id !== featuredProduct?.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col items-start space-y-6">
                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                    {content?.hero?.headline ?? "World’s First Smart AI Surveillance Agent"}
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl font-bold">
                  {content?.hero?.subHeadline ?? "Protecting your life, assets, and peace of mind — DIFAE AI predicts danger before it happens."}
                </p>
                <p className="max-w-[600px] text-muted-foreground md:text-lg">
                  {content?.hero?.description ?? "DIFAE AI is an intelligent surveillance system built to safeguard you from every kind of physical, financial, and cyber threat. Unlike ordinary cameras that only record, DIFAE actively monitors, detects, predicts, and reports danger in real time. It’s your personal AI security agent — always awake, always alert."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                    <Link href="/products">Get DIFAE Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/contact"><Phone className="mr-2 h-4 w-4" />Book a Demo</Link>
                </Button>
                </div>
            </div>
             <div className="aspect-video rounded-xl overflow-hidden shadow-2xl bg-muted">
                <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/9KsJnCt3NVE"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="w-full py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-headline text-muted-foreground">
                            Our Products
                        </div>
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                            Find the Right Security Plan
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Choose from our AI agent subscription for your existing cameras or our all-in-one smart camera solutions.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 items-start">
                    {featuredProduct && (
                        <Link key={featuredProduct.id} href={`/products/${featuredProduct.id}`} className="flex lg:col-span-1">
                             <Card className="flex flex-col w-full bg-background hover:shadow-lg hover:-translate-y-2 transition-transform duration-300">
                                <CardHeader>
                                    {featuredProduct.images && featuredProduct.images.length > 0 ? (
                                    <Carousel className="w-full max-w-full">
                                        <CarouselContent>
                                        {featuredProduct.images.map((image, index) => (
                                            <CarouselItem key={index}>
                                            <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
                                                <Image src={image} alt={`${featuredProduct.title} image ${index + 1}`} fill className="object-cover" />
                                            </div>
                                            </CarouselItem>
                                        ))}
                                        </CarouselContent>
                                        {featuredProduct.images.length > 1 && (
                                        <>
                                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                                        </>
                                        )}
                                    </Carousel>
                                    ) : (
                                    <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                                        <Video className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    )}
                                    <CardTitle className="font-headline">{featuredProduct.title}</CardTitle>
                                    <CardDescription>{featuredProduct.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <p className="text-3xl font-bold font-headline">Rs {featuredProduct.price.toLocaleString()}<span className="text-base font-medium text-muted-foreground">{featuredProduct.priceDescription}</span></p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {featuredProduct.features.slice(0, 3).map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuyNow(featuredProduct); }}>
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Buy Now
                                    </Button>
                                </CardFooter>
                                </Card>
                        </Link>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
                        {otherProducts.map((product) => (
                             <Link key={product.id} href={`/products/${product.id}`} className="flex">
                                <Card className="flex flex-col w-full bg-background hover:shadow-lg hover:-translate-y-2 transition-transform duration-300">
                                <CardHeader>
                                    {product.images && product.images.length > 0 ? (
                                    <Carousel className="w-full max-w-full">
                                        <CarouselContent>
                                        {product.images.map((image, index) => (
                                            <CarouselItem key={index}>
                                            <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
                                                <Image src={image} alt={`${product.title} image ${index + 1}`} fill className="object-cover" />
                                            </div>
                                            </CarouselItem>
                                        ))}
                                        </CarouselContent>
                                        {product.images.length > 1 && (
                                        <>
                                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                                        </>
                                        )}
                                    </Carousel>
                                    ) : (
                                    <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                                        <Video className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    )}
                                    <CardTitle className="font-headline">{product.title}</CardTitle>
                                    <CardDescription>{product.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <p className="text-3xl font-bold font-headline">Rs {product.price.toLocaleString()}<span className="text-base font-medium text-muted-foreground">{product.priceDescription}</span></p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {product.features.slice(0, 3).map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuyNow(product); }}>
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Buy Now
                                    </Button>
                                </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>


        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-headline text-secondary-foreground">
                            Core Features
                        </div>
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                            {content?.features?.headline ?? "Your Cameras, Now Smarter Than Ever"}
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            {content?.features?.description ?? "Our comprehensive suite of AI-powered tools from BERRETO provides unparalleled security and gives you true peace of mind."}
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid justify-center gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-12">
                    {features.map((feature) => (
                    <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
                        <CardHeader className="items-center text-center">
                            {feature.icon}
                            <CardTitle className="font-headline mt-2">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground">{feature.description}</p>
                            <Button asChild variant="link" className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={feature.link}>Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-16 md:py-24 bg-secondary">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-headline text-muted-foreground">
                            How It Works
                        </div>
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                            {content?.howItWorks?.headline ?? "Powerful Protection in 4 Simple Steps"}
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           {content?.howItWorks?.description ?? "If anything comes under the Safe zone of this surveillance agent, it will be detected and informed to the owner and guards as well and if owner feels its high priority alert, then owner can trigger it and AI agent will generate auto call to the Police authorities."}
                        </p>
                    </div>
                </div>
                 <div className="relative mt-12">
                    <div className="absolute left-1/2 top-0 -bottom-0 w-px bg-border -translate-x-1/2 hidden md:block"></div>
                    {howItWorks.map((item, index) => (
                        <div key={item.step} className="relative flex md:items-center py-6 md:py-8 group">
                            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary text-primary font-bold font-headline shrink-0 absolute left-1/2 -translate-x-1/2 z-10">
                                {item.step}
                            </div>
                            <div className={`w-full md:w-1/2 p-4 md:pr-16 text-left ${index % 2 === 0 ? '' : 'md:ml-auto md:pl-16 md:text-right'}`}>
                                <h3 className="text-2xl font-bold font-headline mb-2">{item.title}</h3>
                                <p className="text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Use Cases Section */}
        <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-headline text-secondary-foreground">
                            Use Cases
                        </div>
                        <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                            {content?.useCases?.headline ?? "Security for Every Need"}
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           {content?.useCases?.description ?? "BERRETO adapts to your unique security challenges, from a single-family home to a large-scale business operation."}
                        </p>
                    </div>
                </div>
                 <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-4 lg:gap-10">
                    {useCases.map(useCase => (
                        <div key={useCase.name} className="flex flex-col items-center justify-center space-y-3">
                            <div className="p-4 bg-secondary rounded-full">
                                {useCase.icon}
                            </div>
                            <h4 className="font-semibold">{useCase.name}</h4>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="container mx-auto px-6 md:px-10 lg:px-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <Siren className="h-12 w-12" />
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                         {content?.cta?.headline ?? "Ready to Experience True Peace of Mind?"}
                    </h2>
                    <p className="max-w-[600px] md:text-xl">
                        {content?.cta?.description ?? "Stop watching recordings of the past. Start preventing threats in the future. Sign up now and see what you've been missing."}
                    </p>
                     <Button asChild size="lg" variant="secondary" className="font-headline mt-4">
                        <Link href="/signup">Get Your AI Security Agent Today</Link>
                    </Button>
                </div>
            </div>
        </section>
        <PageAssistant pageContext="This is the main homepage for BERRETO. It introduces the company's AI security solutions, highlighting features like threat detection, smart alerts, and facial recognition. It explains how the DIFAE AI agent works and presents use cases." />
      </main>
      <Footer />
    </div>
  );
}
