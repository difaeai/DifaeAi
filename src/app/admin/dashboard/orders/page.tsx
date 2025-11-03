
"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Copy, Ban, FileImage, Loader2, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Order } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, doc, query, orderBy, onSnapshot, deleteDoc } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateOrder } from "@/lib/actions/admin-actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// This is a client-side function for deletion. It needs proper error handling.
function deleteOrderClient(orderId: string) {
    const docRef = doc(db, 'orders', orderId);
    
    // The .catch() block handles permission errors asynchronously.
    deleteDoc(docRef)
      .catch(async (serverError) => {
        // In a real app, you would emit this to a global error handler
        // that can display a more detailed error overlay for debugging.
        console.error("Firestore Permission Error on Delete:", {
            path: docRef.path,
            operation: 'delete',
            error: serverError.message,
        });
      });
}


export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();

  // State for Edit/Delete operations
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'orders'), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            fetchedOrders.push({
                id: doc.id,
                ...data,
                createdAt,
            } as Order);
        });
        setAllOrders(fetchedOrders);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching orders: ", error);
        toast({ variant: "destructive", title: "Failed to load orders." });
        setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast]);

  const regularOrders = allOrders.filter(order => order.type !== 'Pre-Booking');
  const preBookings = allOrders.filter(order => order.type === 'Pre-Booking');

  const handleApproveRequest = (orderId: string) => {
    const orderToApprove = allOrders.find(o => o.id === orderId);
    if (!orderToApprove) return;

    startTransition(async () => {
      let uniqueId: string | undefined = undefined;
      if (orderToApprove.items.toLowerCase().includes("camera") || orderToApprove.items.toLowerCase().includes("dsg")) {
          let prefix = "DSG";
          if (orderToApprove.items.toLowerCase().includes("pro")) prefix = "DSGPRO";
          if (orderToApprove.items.toLowerCase().includes("vision")) prefix = "DSGVIS";
          uniqueId = `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }
      
      const activationDate = new Date().toISOString().split('T')[0];
      const updateData: any = { status: "Approved", activationDate };
      if (uniqueId) {
          updateData.uniqueId = uniqueId;
      }
      
      try {
        const result = await updateOrder(orderId, updateData);
        if (result.success) {
            toast({
              title: "Order Approved!",
              description: uniqueId 
                ? `Activation ID generated for ${orderToApprove.customerName}: ${uniqueId}`
                : `Order for ${orderToApprove.customerName} has been approved.`,
            });
        } else {
            toast({ variant: 'destructive', title: 'Approval Failed', description: result.message });
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Approval Failed', description: error.message || 'An unexpected error occurred.' });
      }
    });
  };

  const handleRejectRequest = (orderId: string) => {
    const orderToReject = allOrders.find(o => o.id === orderId);
    if (!orderToReject) return;
    
    startTransition(async () => {
      const updateData: any = { status: "Rejected" };
      try {
        const result = await updateOrder(orderId, updateData);
        if (result.success) {
          toast({
            variant: "destructive",
            title: "Order Rejected",
            description: `The order from ${orderToReject.customerName} has been rejected.`,
          });
        } else {
          toast({ variant: 'destructive', title: 'Rejection Failed', description: result.message });
        }
       } catch (error: any) {
        toast({ variant: 'destructive', title: 'Rejection Failed', description: error.message || 'An unexpected error occurred.' });
      }
    });
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!", description: text });
  };


  const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orderToEdit) return;

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const dataToUpdate = {
          customerName: formData.get('customerName') as string,
          customerEmail: formData.get('customerEmail') as string,
          customerPhone: formData.get('customerPhone') as string,
          items: formData.get('items') as string,
          total: Number(formData.get('total')),
      };

      try {
        const result = await updateOrder(orderToEdit.id, dataToUpdate);

        if (result.success) {
            toast({ title: 'Order Updated', description: 'The order details have been saved.' });
            setOrderToEdit(null);
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
        }
      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'An unexpected error occurred.' });
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    deleteOrderClient(orderToDelete.id);
    setOrderToDelete(null);
    toast({ title: 'Delete Initiated', description: `Attempting to delete order from ${orderToDelete.customerName}.` });
  };
  
  const renderOrdersTable = (orders: Order[], emptyMessage: string) => (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Proof</TableHead>
            <TableHead>Action / Activation ID</TableHead>
            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                   {order.customerPhone && <div className="text-sm text-muted-foreground">{order.customerPhone}</div>}
                </TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell>Rs {order.total.toLocaleString()}</TableCell>
                <TableCell>
                   <Badge
                    variant={getStatusVariant(order.status)}
                    className={order.status === 'Approved' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {order.status === 'Approved' && <CheckCircle className="mr-1 h-3 w-3"/>}
                    {order.status === 'Pending' && <Clock className="mr-1 h-3 w-3"/>}
                    {order.status === 'Rejected' && <Ban className="mr-1 h-3 w-3"/>}
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.paymentProofUrl ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileImage className="mr-2 h-4 w-4" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Payment Proof for Order {order.id.substring(0, 8)}...</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 flex justify-center">
                          <Image
                            src={order.paymentProofUrl}
                            alt={`Payment proof for order ${order.id}`}
                            width={400}
                            height={600}
                            className="rounded-md object-contain max-h-[70vh] w-auto"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                   {order.status === 'Pending' ? (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(order.id)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Reject'}
                        </Button>
                        <Button size="sm" onClick={() => handleApproveRequest(order.id)} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Approve'}
                        </Button>
                    </div>
                  ) : order.status === 'Approved' && order.uniqueId ? (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{order.uniqueId}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(order.uniqueId!)}>
                            <Copy className="h-4 w-4"/>
                        </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setOrderToEdit(order)}>
                                <Edit className="mr-2 h-4 w-4"/> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setOrderToDelete(order)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );

  return (
    <>
        {/* Edit Dialog */}
        <Dialog open={!!orderToEdit} onOpenChange={(open) => !open && setOrderToEdit(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Order</DialogTitle>
                    <DialogDescription>
                        Modify the details for order ID: {orderToEdit?.id.substring(0, 8)}...
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customerName" className="text-right">Name</Label>
                            <Input id="customerName" name="customerName" defaultValue={orderToEdit?.customerName} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customerEmail" className="text-right">Email</Label>
                            <Input id="customerEmail" name="customerEmail" defaultValue={orderToEdit?.customerEmail} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customerPhone" className="text-right">Phone</Label>
                            <Input id="customerPhone" name="customerPhone" defaultValue={orderToEdit?.customerPhone} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="items" className="text-right">Items</Label>
                            <Input id="items" name="items" defaultValue={orderToEdit?.items} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="total" className="text-right">Total (Rs)</Label>
                            <Input id="total" name="total" type="number" defaultValue={orderToEdit?.total} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the order from <span className="font-bold">{orderToDelete?.customerName}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOrderToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Order
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline">Order Management</h1>
          </div>
           <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Incoming Orders</TabsTrigger>
                <TabsTrigger value="prebookings">Pre-Bookings</TabsTrigger>
              </TabsList>
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Incoming Orders</CardTitle>
                    <CardDescription>
                      Review and process all incoming paid orders from users.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderOrdersTable(regularOrders, "No pending orders.")}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="prebookings">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Pre-Bookings</CardTitle>
                    <CardDescription>
                      Manage all pre-booking requests. No payment is required for these.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderOrdersTable(preBookings, "No pre-bookings found.")}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
    </>
  );
}

    