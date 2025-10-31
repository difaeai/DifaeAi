
"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ShoppingCart, Video } from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    if (params.id) {
      const fetchProduct = async () => {
        setIsLoading(true);
        const fetchedProduct = await getProductById(params.id);
        setProduct(fetchedProduct);
        setIsLoading(false);
      };
      fetchProduct();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (!product) {
    notFound();
  }
  
  const selectedImage = product.images && product.images.length > 0 ? product.images[selectedImageIndex] : null;

  const handleBuyNow = () => {
    addToCart({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        image: (product.images && product.images[0]) || '' 
    });
    openCart();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <div className="container mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Image Gallery */}
            <div className="lg:col-span-3 w-full space-y-4">
               {selectedImage ? (
                 <div className="aspect-video relative overflow-hidden rounded-lg shadow-lg bg-muted">
                    <Image
                        src={selectedImage}
                        alt={`${product.title} image ${selectedImageIndex + 1}`}
                        fill
                        className="object-cover"
                    />
                 </div>
               ) : (
                 <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <Video className="h-16 w-16 text-muted-foreground"/>
                 </div>
               )}
               
               {product.images && product.images.length > 1 && (
                 <div className="grid grid-cols-5 gap-3">
                    {product.images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={cn(
                                "aspect-square relative overflow-hidden rounded-md border-2 transition-all",
                                index === selectedImageIndex ? "border-primary shadow-md" : "border-transparent hover:border-muted-foreground/50"
                            )}
                        >
                            <Image
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                 </div>
               )}
            </div>

            {/* Product Details */}
            <div className="lg:col-span-2 flex flex-col">
              <h1 className="text-3xl lg:text-4xl font-headline font-bold">{product.title}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{product.description}</p>
              
              <div className="mt-6">
                <p className="text-4xl font-bold font-headline">
                  Rs {product.price.toLocaleString()}
                  <span className="text-lg font-medium text-muted-foreground">{product.priceDescription}</span>
                </p>
                 {product.subscription && <p className="text-md font-semibold mt-1">{product.subscription}</p>}
              </div>

              <div className="mt-8 space-y-4">
                 <p className="text-muted-foreground">{product.longDescription}</p>
                 <p className="text-sm">Ideal for: <span className="font-semibold">{product.idealFor}</span></p>
              </div>

              <ul className="mt-8 space-y-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto pt-8">
                 <Button size="lg" className="w-full font-headline" onClick={handleBuyNow}>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {product.primaryActionText}
                 </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
