
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle, Clock, Copy, PackagePlus, Loader2, Ban, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp, addDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    if (status === "Approved") return "default";
    if (status === "Pending") return "secondary";
    if (status === "Rejected") return "destructive";
    return "outline";
}

const calculateRenewal = (order: Order): string => {
    if (order.status !== 'Approved' || !order.activationDate) {
        return 'N/A';
    }

    const activation = new Date(order.activationDate);
    if (isNaN(activation.getTime())) {
        return 'Invalid Date';
    }

    const now = new Date();
    let renewalDate: Date;
    let fee: number | null = null;
    let isFreeTier = false;

    const itemName = order.items.toLowerCase();

    if (itemName.includes('vision')) {
        fee = 450;
        let firstRenewal = new Date(activation);
        firstRenewal.setMonth(firstRenewal.getMonth() + 3);

        if (now < firstRenewal) {
            renewalDate = firstRenewal;
            isFreeTier = true;
        } else {
            renewalDate = new Date(firstRenewal);
            while (renewalDate < now) {
                renewalDate.setMonth(renewalDate.getMonth() + 1);
            }
        }
    } else if (itemName.includes('pro')) {
        fee = 350;
        renewalDate = new Date(activation);
        while (renewalDate < now) {
            renewalDate.setMonth(renewalDate.getMonth() + 1);
        }
    } else {
        return 'N/A'; // Not a subscription product
    }

    const formattedDate = renewalDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    if (isFreeTier) {
        return `Free tier ends ${formattedDate}`;
    }

    return `${formattedDate} (Rs ${fee})`;
};


export default function MySubscriptionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [purchaseHistory, setPurchaseHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalProof, setRenewalProof] = useState<File | null>(null);
  const [renewalProofPreview, setRenewalProofPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
        const userOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            const safeConvertTimestamp = (field: any): string | undefined => {
                if (!field) return undefined;
                if (field instanceof Timestamp) {
                    return field.toDate().toISOString();
                }
                if (typeof field === 'string') {
                    // Check if it is a valid date string
                    if (!isNaN(new Date(field).getTime())) {
                        return new Date(field).toISOString();
                    }
                }
                if(typeof field === 'object' && typeof field.seconds === 'number') {
                    return new Date(field.seconds * 1000).toISOString();
                }
                return undefined;
            };

            userOrders.push({
                id: doc.id,
                ...data,
                createdAt: safeConvertTimestamp(data.createdAt) || new Date().toISOString(),
                activationDate: safeConvertTimestamp(data.activationDate),
            } as Order);
        });
        
        userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setPurchaseHistory(userOrders);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to load purchase information:", error);
        toast({ variant: 'destructive', title: 'Could not load purchase information.', description: "There was an error fetching your order history." });
        setIsLoading(false);
    });

    return () => unsubscribe();
   }, [user?.uid, toast]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!", description: text });
  };
  
  const handleRenewalProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRenewalProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setRenewalProof(file);
    }
  };
  
  const handleRenewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!user) {
          toast({ variant: 'destructive', title: 'You must be logged in' });
          return;
      }
      if (!renewalProof || !renewalProofPreview) {
          toast({ variant: 'destructive', title: 'Payment proof is required' });
          return;
      }
      
      const formData = new FormData(e.target as HTMLFormElement);
      const uniqueId = formData.get('renewal-id') as string;
      const originalOrder = purchaseHistory.find(o => o.uniqueId === uniqueId && o.status === 'Approved');
      
      if (!originalOrder) {
          toast({ variant: 'destructive', title: 'Invalid Activation ID', description: 'Could not find an active subscription with that ID.' });
          return;
      }

      setIsRenewing(true);
      try {
          const renewalOrderPayload = {
              userId: user.uid,
              customerName: user.displayName || 'Unknown',
              customerEmail: user.email || 'no-email',
              items: `Renewal for: ${originalOrder.items} (ID: ${uniqueId})`,
              total: originalOrder.total,
              status: 'Pending' as const,
              paymentProofUrl: renewalProofPreview,
              createdAt: Timestamp.now(),
          };

          await addDoc(collection(db, 'orders'), renewalOrderPayload);
          
          toast({ title: 'Renewal Submitted', description: 'Your renewal request is pending approval.' });
          setRenewalProof(null);
          setRenewalProofPreview(null);
          (e.target as HTMLFormElement).reset();

      } catch (error) {
          console.error("Renewal submission error:", error);
          toast({ variant: 'destructive', title: 'Renewal Failed', description: 'Could not submit your renewal request.' });
      } finally {
          setIsRenewing(false);
      }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">My Subscriptions & Purchases</h1>
            <p className="text-muted-foreground">Manage your product subscriptions and view your purchase history.</p>
        </div>
         <Button asChild>
            <Link href="/products"><PackagePlus className="mr-2 h-4 w-4"/> Purchase New Product</Link>
          </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Purchases</CardTitle>
          <CardDescription>
            This table shows all your orders. Once an order is 'Approved', you can copy its Unique Activation ID and use it on the <Link href="/dashboard/connect-camera" className="text-primary underline">Connect Camera</Link> page to activate your new camera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item(s)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unique Activation ID</TableHead>
                <TableHead>Activation Date</TableHead>
                <TableHead className="text-right">Next Renewal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
              ) : purchaseHistory.length > 0 ? (
                purchaseHistory.map((purchase) => (
                <TableRow key={purchase.id}>
                   <TableCell className="font-medium">{purchase.items}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(purchase.status)}
                      className={purchase.status === "Approved" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {purchase.status === 'Approved' ? <CheckCircle className="mr-1 h-3 w-3"/> : purchase.status === 'Pending' ? <Clock className="mr-1 h-3 w-3"/> : <Ban className="mr-1 h-3 w-3" />}
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {purchase.status === 'Approved' && purchase.uniqueId ? (
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{purchase.uniqueId}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(purchase.uniqueId!)}>
                                <Copy className="h-4 w-4"/>
                            </Button>
                        </div>
                    ) : purchase.status === 'Pending' ? (
                        <span className="text-xs text-muted-foreground">Generated on approval</span>
                    ) : (
                        <span className="text-xs text-muted-foreground">{purchase.status === 'Approved' ? 'N/A' : '-'}</span>
                    )}
                  </TableCell>
                   <TableCell className="font-mono text-xs">
                    {purchase.activationDate ? new Date(purchase.activationDate).toLocaleDateString('en-GB') : "N/A"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {calculateRenewal(purchase)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        You have no purchase history yet. Purchase a product to get started.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Renew Subscription</CardTitle>
            <CardDescription>
                To renew an active subscription, enter its Activation ID, upload your new payment proof, and submit for approval.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRenewSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="renewal-id">Unique Activation ID to Renew</Label>
                    <Input id="renewal-id" name="renewal-id" placeholder="e.g., DSGPRO-G4H7J2K9L" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="renewal-proof">New Payment Proof</Label>
                    <Input id="renewal-proof" name="renewal-proof" type="file" accept="image/*" onChange={handleRenewalProofChange} required />
                </div>
                {renewalProofPreview && (
                    <div className="mt-2">
                        <Image src={renewalProofPreview} alt="Renewal payment proof preview" width={100} height={100} className="rounded-md border object-cover" />
                    </div>
                )}
                <Button type="submit" disabled={isRenewing}>
                    {isRenewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    {isRenewing ? 'Submitting...' : 'Submit Renewal'}
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

    