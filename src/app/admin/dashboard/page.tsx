
"use client"
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Video, Clock, UserPlus, ShoppingCart, Bot } from "lucide-react";
import { User, Order, Camera } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, collectionGroup, query, where } from "firebase/firestore";

async function getUsers(): Promise<User[]> {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        return usersSnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

async function getOrders(): Promise<Order[]> {
    try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersList = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toISOString() 
                : data.createdAt;
            return {
                id: doc.id,
                ...data,
                createdAt,
            } as Order;
        });
        return ordersList;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

async function getOnlineCamerasCount(): Promise<number> {
    try {
        const q = query(collectionGroup(db, 'cameras'), where('status', '==', 'Online'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error("Error fetching online cameras:", error);
        return 0;
    }
}


export default function AdminDashboardPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [onlineCamerasCount, setOnlineCamerasCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
      const fetchData = async () => {
          if (!user) return;
          setIsLoading(true);
          try {
            const [usersData, ordersData, camerasCount] = await Promise.all([
                getUsers(), 
                getOrders(),
                getOnlineCamerasCount(),
            ]);

            setAllUsers(usersData || []);
            setAllOrders(ordersData || []);
            setOnlineCamerasCount(camerasCount || 0);

          } catch(error) {
             toast({ variant: "destructive", title: "Failed to load dashboard data." });
          } finally {
            setIsLoading(false);
          }
      };
      if (user) {
        fetchData();
      }
  }, [toast, user]);

  const approvedUserIds = new Set(allOrders.filter(o => o.status === 'Approved').map(o => o.userId));
  const approvedUsers = allUsers.filter(u => approvedUserIds.has(u.uid));

  const activeUsers = approvedUsers.filter(u => u.status === 'Active');
  const activeSubscriptions = activeUsers.length;
  const totalUsers = approvedUsers.length;
  
  const pendingOrders = allOrders.filter(o => o.status === 'Pending').length;
  
  const recentUsers = [...allUsers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      description: `${activeSubscriptions} active subscriptions`,
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toString(),
      icon: <Clock className="h-6 w-6 text-muted-foreground" />,
      description: "Require approval",
       href: "/admin/dashboard/orders"
    },
    {
      title: "Active Cameras",
      value: onlineCamerasCount.toString(),
      icon: <Video className="h-6 w-6 text-muted-foreground" />,
      description: "Across all active users",
      href: "/admin/dashboard/cameras"
    },
     {
      title: "DIFAE AI Agent",
      value: "Online",
      icon: <Bot className="h-6 w-6 text-green-500" />,
      description: "All systems operational",
      href: "/admin/dashboard/agent"
    },
  ];
  
  const firstName = user?.displayName?.split(' ')[0] || 'Admin';

  if (isLoading && !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline">Welcome, {firstName}</h1>
            <p className="text-muted-foreground">Here's a snapshot of your platform's activity.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-headline">
                    {stat.title}
                </CardTitle>
                {stat.icon}
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                    {stat.href ? (
                        <Link href={stat.href} className="hover:underline text-primary">{stat.description}</Link>
                    ) : stat.description}
                </p>
                </CardContent>
            </Card>
            ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Recent Users</CardTitle>
                        <CardDescription>
                            The latest users who have signed up for BERRETO.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Sign-up Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : recentUsers.length > 0 ? recentUsers.map(user => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === "Active" ? "default" : "destructive"} className={user.status === 'Active' ? 'bg-green-500' : ''}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No users yet.</TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Quick Actions</CardTitle>
                        <CardDescription>
                            Jump directly to common admin tasks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/admin/dashboard/users"><UserPlus className="mr-2 h-4 w-4"/> Add New User</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/admin/dashboard/orders"><ShoppingCart className="mr-2 h-4 w-4"/> Manage Orders</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/admin/dashboard/agent"><Bot className="mr-2 h-4 w-4"/> Manage DIFAE Agent</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
