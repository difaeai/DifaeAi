
"use client";

import { useState, useEffect, useTransition } from "react";
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
import { MoreHorizontal, PlusCircle, Loader2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Order, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { updateUserStatus, getUserById } from "@/lib/actions/admin-actions";


async function getApprovedOrders(): Promise<Order[]> {
    const q = query(collection(db, 'orders'), where('status', '==', 'Approved'));
    const ordersSnapshot = await getDocs(q);
    return ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        const activationDate = data.activationDate ? new Date(data.activationDate).toISOString() : undefined;
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            activationDate: activationDate,
        } as Order;
    });
}


const calculateRenewal = (order: Order): string => {
    if (!order || order.status !== 'Approved' || !order.activationDate) {
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
        const threeMonthsFromActivation = new Date(activation);
        threeMonthsFromActivation.setMonth(threeMonthsFromActivation.getMonth() + 3);

        if (now < threeMonthsFromActivation) {
            renewalDate = threeMonthsFromActivation;
            isFreeTier = true;
        } else {
            let nextRenewal = new Date(threeMonthsFromActivation);
            while(nextRenewal < now) {
                nextRenewal.setMonth(nextRenewal.getMonth() + 1);
            }
            renewalDate = nextRenewal;
        }
    } else if (itemName.includes('pro')) {
        fee = 350;
        let nextRenewal = new Date(activation);
        // Start from the month after activation
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        while(nextRenewal < now) {
            nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        }
        renewalDate = nextRenewal;
    } else {
        return 'N/A';
    }

    const formattedDate = renewalDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    if (isFreeTier) {
        return `Free tier ends ${formattedDate}`;
    }

    return `${formattedDate} (Rs ${fee})`;
};


export default function UsersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const approvedOrders = await getApprovedOrders();
        const usersData = new Map<string, User>();

        for (const order of approvedOrders) {
          if (!usersData.has(order.userId)) {
            const user = await getUserById(order.userId);
            if (user) {
              usersData.set(order.userId, user);
            }
          }
        }
        
        setOrders(approvedOrders);
        setUsers(usersData);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ variant: 'destructive', title: 'Failed to load user data' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [toast]);


  const handleToggleStatus = (userId: string, currentStatus: 'Active' | 'Inactive') => {
    startTransition(async () => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        const result = await updateUserStatus(userId, newStatus);
        
        if (result.success) {
            setUsers(prevUsers => {
                const newUsers = new Map(prevUsers);
                const userToUpdate = newUsers.get(userId);
                if (userToUpdate) {
                    newUsers.set(userId, { ...userToUpdate, status: newStatus });
                }
                return newUsers;
            });
            toast({ title: 'User Status Updated', description: `User is now ${newStatus}.` });
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
        }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!", description: text });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">User Management & Billing</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Subscribed Users</CardTitle>
          <CardDescription>
            A list of all active user subscriptions. Each row represents a single approved product subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Activation ID</TableHead>
                <TableHead>Next Renewal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const user = users.get(order.userId);
                  if (!user) {
                      return (
                        <TableRow key={order.id}>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-4">
                              Could not load user data for order {order.id}. User may have been deleted.
                          </TableCell>
                        </TableRow>
                      );
                  }
                  const userStatus = user.status;
                  return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.avatar}
                            alt={user.name}
                          />
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <span>{user.uid}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(user.uid)}>
                                <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.items}
                    </TableCell>
                     <TableCell className="font-mono text-xs">
                      {order.uniqueId || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {calculateRenewal(order)}
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                        <Switch
                          id={`status-toggle-${order.id}`}
                          checked={userStatus === "Active"}
                          onCheckedChange={() => handleToggleStatus(user.uid, userStatus)}
                          disabled={isPending}
                          aria-label={`Toggle status for ${user.name}`}
                        />
                        <Label
                          htmlFor={`status-toggle-${order.id}`}
                          className={cn(
                            "cursor-pointer font-semibold",
                            userStatus === "Active"
                              ? "text-green-600"
                              : "text-destructive"
                          )}
                        >
                          {userStatus}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit Subscription</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No subscribed users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
