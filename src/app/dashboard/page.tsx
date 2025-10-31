
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Shield, ShieldCheck, Users, Video, Clock, Siren, CheckCircle, Package } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Camera } from "@/lib/types";

// Mock data, as no events are being generated yet.
const recentActivity: { time: string; type: 'threat' | 'info'; description: string }[] = [];


export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        // Check for pending orders
        const qOrders = query(collection(db, "orders"), where("userId", "==", user.uid), where("status", "==", "Pending"), limit(1));
        const orderSnapshot = await getDocs(qOrders);
        setHasPendingOrder(!orderSnapshot.empty);

        // Fetch cameras
        const qCameras = query(collection(db, "users", user.uid, "cameras"), orderBy("createdAt", "desc"));
        const cameraSnapshot = await getDocs(qCameras);
        const userCameras = cameraSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camera));
        setCameras(userCameras);
      }
    }
    fetchData();
  }, [user]);

  const onlineCameras = cameras.filter(c => c.status === 'Online').length;
  const offlineCameras = cameras.length - onlineCameras;

  const stats = [
    {
      title: "Total Cameras",
      value: cameras.length,
      icon: <Video className="h-6 w-6 text-muted-foreground" />,
      description: `${onlineCameras} Online`,
      href: "/dashboard/cameras"
    },
    {
      title: "Active Threats",
      value: "0",
      icon: <AlertTriangle className="h-6 w-6 text-muted-foreground" />,
      description: "No active threats",
      href: "/dashboard/threat-detection"
    },
     {
      title: "Monitored Items",
      value: "0",
      icon: <ShieldCheck className="h-6 w-6 text-muted-foreground" />,
      description: "No items watched",
      href: "/dashboard/theft-alerts"
    },
     {
      title: "Subscription",
      value: "Active",
      icon: <Package className="h-6 w-6 text-muted-foreground" />,
      description: "Manage your plan",
      href: "/dashboard/my-orders"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Welcome, {user?.displayName?.split(' ')[0] || 'User'}</h1>
            <p className="text-muted-foreground">Here is a summary of your security dashboard.</p>
        </div>
        <div className="space-x-2">
           <Button asChild>
            <Link href="/dashboard/cameras">Manage Cameras</Link>
          </Button>
        </div>
      </div>
      
      {hasPendingOrder && (
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardHeader className="flex-row items-center gap-4">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Your Order is Pending Approval</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                You will get full access to all features once an admin has approved your subscription request.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/my-orders">Check Order Status</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
             <CardHeader>
                <CardTitle className="font-headline">System Status</CardTitle>
                <CardDescription>A real-time overview of your security network.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <CheckCircle className="h-16 w-16 md:h-12 md:w-12 shrink-0"/>
                    <div>
                        <h3 className="text-xl font-bold font-headline">All Systems Operational</h3>
                        <p className="text-sm">Your connected cameras are online and the DIFAE AI agent is actively monitoring your properties. No immediate threats have been detected.</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
                <Button asChild>
                    <Link href="/dashboard/threat-detection">
                        <Shield className="mr-2 h-4 w-4"/>
                        View Live Threat Feed
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href="/dashboard/emergency-responders">
                        <Siren className="mr-2 h-4 w-4"/>
                        Emergency Contacts
                    </Link>
                </Button>
            </CardFooter>
        </Card>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
             {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium font-headline flex items-center justify-between">
                            {stat.title}
                            {stat.icon}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {stat.href ? <Link href={stat.href} className="hover:underline">{stat.description}</Link> : stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
            <CardDescription>
              A log of the latest events and alerts from your cameras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Time</TableHead>
                  <TableHead className="w-[150px]">Event Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{activity.time}</TableCell>
                        <TableCell>
                            {activity.type === 'threat' ? (
                                <span className="font-semibold text-destructive">Threat Detected</span>
                            ) : (
                                <span className="text-muted-foreground">System Info</span>
                            )}
                        </TableCell>
                        <TableCell>{activity.description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No recent activity to display.
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
