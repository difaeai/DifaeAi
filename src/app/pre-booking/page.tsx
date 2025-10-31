
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, addDoc, Timestamp } from "firebase/firestore";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

async function getProducts(): Promise<Product[]> {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy("price"));
    const productsSnapshot = await getDocs(q);
    if (productsSnapshot.empty) return [];
    return productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export default function PreBookingPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const productsData = await getProducts();
                setProducts(productsData);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Failed to load products' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [toast]);

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        formRef.current?.reset();
        setSelectedProduct('');
        setQuantity(1);
        toast({ title: 'Form Cleared', description: 'Your pre-booking form has been cleared.' });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!selectedProduct) {
            toast({ variant: 'destructive', title: 'No Product Selected', description: 'Please select a product to pre-book.' });
            return;
        }
        
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const productDetails = products.find(p => p.id === selectedProduct);
        const customerName = formData.get('name') as string;
        const customerEmail = formData.get('email') as string;
        const customerPhone = formData.get('phone') as string;

        try {
            const orderData: any = {
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                items: `${quantity}x ${productDetails?.name || 'Unknown Product'}`,
                total: (productDetails?.price || 0) * quantity,
                status: 'Pending',
                createdAt: Timestamp.now(),
                type: 'Pre-Booking', // Tag this order as a pre-booking
            };

            // Conditionally add userId if the user is logged in
            if (user) {
                orderData.userId = user.uid;
            }

            await addDoc(collection(db, 'orders'), orderData);

            toast({ title: 'Pre-Booking Successful!', description: 'Your order has been placed. We will contact you soon.' });
            
            formRef.current?.reset();
            setSelectedProduct('');
            setQuantity(1);

        } catch (error: any) {
            console.error("Pre-booking submission error:", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'There was an error placing your pre-booking.' });
        } finally {
            setIsSubmitting(false);
        }
    };


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-20 md:py-24 bg-secondary">
          <div className="container mx-auto px-6 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">Pre-Book Your AI Security</h1>
            <p className="max-w-2xl mx-auto mt-4 text-muted-foreground md:text-xl">
              Be the first to get access to our next-generation security solutions. Fill out the form below to reserve your product.
            </p>
          </div>
        </section>
        <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Pre-Booking Form</CardTitle>
                        <CardDescription>Secure your order. No payment required today.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="product">Select Product</Label>
                                        <Select name="product" value={selectedProduct} onValueChange={setSelectedProduct} required>
                                            <SelectTrigger id="product">
                                                <SelectValue placeholder="Choose a product..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} - Rs {p.price.toLocaleString()}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input id="quantity" name="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" name="name" defaultValue={user?.displayName ?? ''} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" name="email" type="email" defaultValue={user?.email ?? ''} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Mobile Number</Label>
                                        <Input id="phone" name="phone" type="tel" required />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-4 pt-4">
                                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        {isSubmitting ? 'Submitting...' : 'Book My Order'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
