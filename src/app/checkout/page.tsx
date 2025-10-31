
"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { useToast } from "@/hooks/use-toast";
import { Banknote, Loader2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { Order } from "@/lib/types";

// This function now ONLY writes to the global /orders collection.
async function addOrderToFirestore(userId: string, orderData: Omit<Order, 'id' | 'createdAt' | 'userId'>): Promise<string> {
    const docData = {
        userId,
        ...orderData,
        createdAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'orders'), docData);
    return docRef.id;
}


export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { user } = useAuth();


  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE_MB = 3;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
      const LOW_QUALITY_THRESHOLD_BYTES = 1 * 1024 * 1024;

      if (file.size > MAX_SIZE_BYTES) {
          toast({
              variant: "destructive",
              title: "Image Too Large",
              description: `Please upload an image smaller than ${MAX_SIZE_MB}MB.`,
          });
          e.target.value = ""; 
          setPaymentProof(null);
          setPaymentProofPreview(null);
          return;
      }
      
      if (file.size < LOW_QUALITY_THRESHOLD_BYTES) {
          toast({
              title: "Low Quality Image",
              description: "Image is under 1MB. Low quality images are acceptable.",
          });
      }

      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  if (cartItems.length === 0 && typeof window !== 'undefined') {
     router.push('/products');
     return (
        <div className="flex min-h-screen flex-col bg-background">
            <PublicHeader />
            <main className="flex-1 container mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-24">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
                    <p className="text-muted-foreground mt-2">Redirecting you to the products page...</p>
                    <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin" />
                </div>
            </main>
            <Footer />
        </div>
     );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "You must be logged in to place an order.",
        });
        router.push('/login');
        return;
    }

    if (!paymentProof || !paymentProofPreview) {
        toast({
            variant: "destructive",
            title: "Payment Proof Required",
            description: "Please upload your payment receipt to proceed.",
        });
        return;
    }
    
    setIsPlacingOrder(true);
    
    try {
        const orderPayload: Omit<Order, 'id' | 'createdAt' | 'userId'> = {
            customerName: user.displayName || 'Unknown User',
            customerEmail: user.email || 'no-email',
            items: cartItems.map(item => `${item.quantity}x ${item.name}`).join(', '),
            total: cartTotal,
            status: 'Pending' as const,
            paymentProofUrl: paymentProofPreview, // Save the base64 data URI directly
        };

        await addOrderToFirestore(user.uid, orderPayload);

        toast({
            title: "Order Submitted!",
            description: "Your order request has been sent for approval. You will be notified once it's processed."
        });
        clearCart();
        router.push("/dashboard/my-orders");

    } catch (error) {
        console.error("Order submission error:", error);
        toast({
            variant: "destructive",
            title: "Order Failed",
            description: "There was a problem submitting your order. Please try again.",
        });
    } finally {
        setIsPlacingOrder(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 container mx-auto px-6 sm:px-10 lg:px-12 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="order-last md:order-first">
            <h2 className="text-2xl font-headline font-bold mb-6">Order Summary</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold">Rs {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <p>Total</p>
                  <p>Rs {cartTotal.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Checkout Form */}
          <div>
             <h2 className="text-2xl font-headline font-bold mb-6">Checkout</h2>
             <Card>
                <CardHeader>
                    <CardTitle>Shipping & Payment</CardTitle>
                    <CardDescription>Please enter your details to complete the purchase.</CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={handlePlaceOrder} className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-4">Shipping Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" defaultValue={user?.displayName ?? ''} placeholder="John Doe" required />
                                </div>
                                 <div className="space-y-2 col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" placeholder="123 Security Lane" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" placeholder="Lahore" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zip">Postal Code</Label>
                                    <Input id="zip" placeholder="54000" required />
                                </div>
                            </div>
                        </div>

                        <Separator/>
                        
                        <div className="space-y-6 animate-in fade-in">
                          <div>
                              <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Banknote className="h-6 w-6"/>
                                Bank Transfer Details
                              </h3>
                              <Alert>
                                  <AlertTitle>Instructions</AlertTitle>
                                  <AlertDescription>
                                      <p>Please transfer the total amount to the account below and upload a screenshot of your receipt.</p>
                                      <ul className="mt-2 text-sm list-disc pl-5">
                                          <li><strong>Account Title:</strong> BERRETO</li>
                                          <li><strong>Account Number:</strong> PK59BKIP0301600475030001</li>
                                          <li><strong>Bank:</strong> BANK ISLAMI Pakistan</li>
                                      </ul>
                                  </AlertDescription>
                              </Alert>
                              <div className="space-y-2 mt-4">
                                  <Label htmlFor="payment-proof">Upload Payment Proof (Max 3MB)</Label>
                                  <Input id="payment-proof" type="file" accept="image/*" onChange={handleProofChange} required />
                                  {paymentProofPreview && (
                                      <div className="mt-2">
                                          <Image src={paymentProofPreview} alt="Payment proof preview" width={150} height={150} className="rounded-md border object-cover" />
                                      </div>
                                  )}
                              </div>
                          </div>
                        </div>
                        
                        <Button type="submit" className="w-full font-headline" size="lg" disabled={!user || isPlacingOrder}>
                            {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {!user ? "Login to Place Order" : isPlacingOrder ? "Placing Order..." : "Place Order"}
                        </Button>
                    </form>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    