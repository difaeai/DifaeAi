
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Home,
  Video,
  ShieldAlert,
  FileText,
  Camera,
  Eye,
  Siren,
  Package,
  Settings,
  BrainCircuit,
  Loader2,
  Lock,
  ShoppingCart,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/threat-detection", icon: Video, label: "Threat Detection" },
  { href: "/dashboard/theft-alerts", icon: ShieldAlert, label: "Theft Alerts" },
  { href: "/dashboard/visual-search", icon: Eye, label: "Difae EYE" },
  { href: "/dashboard/reports", icon: FileText, label: "Daily Audit Reports" },
  { href: "/dashboard/emergency-responders", icon: Siren, label: "Emergency Responders" },
  { href: "/dashboard/cameras", icon: Camera, label: "Cameras" },
];

type UserApprovalStatus = 'approved' | 'pending' | 'rejected' | 'none';

async function checkUserApprovalStatus(userId: string): Promise<UserApprovalStatus> {
  // 1. Check for any approved order. This is the most important check.
  const approvedQuery = query(
    collection(db, 'orders'),
    where("userId", "==", userId),
    where("status", "==", "Approved"),
    limit(1)
  );

  const approvedSnapshot = await getDocs(approvedQuery);
  if (!approvedSnapshot.empty) {
    return 'approved';
  }

  // 2. If no approved orders, check for any pending orders.
  const pendingQuery = query(
    collection(db, 'orders'),
    where("userId", "==", userId),
    where("status", "==", "Pending"),
    limit(1)
  );
  const pendingSnapshot = await getDocs(pendingQuery);
  if (!pendingSnapshot.empty) {
    return 'pending';
  }

  // 3. If no approved or pending, check if the user has any orders at all.
  const anyOrderQuery = query(
      collection(db, 'orders'),
      where("userId", "==", userId),
      limit(1)
  );
  const anyOrderSnapshot = await getDocs(anyOrderQuery);
  if (anyOrderSnapshot.empty) {
      // User has no orders.
      return 'none';
  }
  
  // 4. If they have orders, but none are approved or pending, they must all be rejected.
  return 'rejected';
}


function AccessDenied({ status }: { status: UserApprovalStatus }) {
  const hasExistingOrder = status === 'pending' || status === 'rejected';
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <Lock className="mx-auto h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-2xl font-headline">Access Denied</CardTitle>
         {status === 'rejected' ? (
          <CardDescription>
            Your recent order was not approved. You need an active subscription to access this page.
          </CardDescription>
        ) : (
          <CardDescription>
            You need an approved subscription to access this page.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-center">
        {status === 'rejected' ? (
             <p className="text-muted-foreground">
                Please review your order details and place a new order to gain access to all dashboard features. If you have questions, please contact support.
            </p>
        ) : (
             <p className="text-muted-foreground">
                Please purchase a product to get started. Access will be granted automatically once your order is approved by an administrator.
            </p>
        )}
        <div className="flex gap-4 justify-center mt-6">
            <Button asChild>
              <Link href="/products"><ShoppingCart className="mr-2 h-4 w-4"/> {hasExistingOrder ? "Re-Order Product" : "Order Product"}</Link>
            </Button>
            {hasExistingOrder && (
              <Button asChild variant="secondary">
                <Link href="/dashboard/my-orders">Check Order Status</Link>
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [approvalStatus, setApprovalStatus] = React.useState<UserApprovalStatus | null>(null);
  
  React.useEffect(() => {
    if (authLoading) {
      return; 
    }
    if (!user) {
      router.replace('/'); 
      return;
    }
    if (user.email === 'admin@difaieai.com') {
      router.replace('/admin/dashboard');
      return;
    }

    checkUserApprovalStatus(user.uid).then(status => {
      setApprovalStatus(status);
    });

  }, [user, authLoading, router]);

  if (authLoading || approvalStatus === null) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  const isApproved = approvalStatus === 'approved';
  // These paths are always allowed, regardless of approval status.
  const alwaysAllowedPaths = ['/dashboard/my-orders', '/dashboard/settings', '/dashboard/train-agent'];
  const isPageAllowed = isApproved || alwaysAllowedPaths.some(p => pathname.startsWith(p));
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold font-headline">
                BERRETO
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={isApproved ? item.href : '#'} aria-disabled={!isApproved} className={!isApproved ? 'pointer-events-none' : ''}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      disabled={!isApproved}
                      tooltip={{ children: item.label }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
                 <SidebarMenuItem>
                    <Link href={"/dashboard/train-agent"} >
                        <SidebarMenuButton
                            isActive={pathname.startsWith("/dashboard/train-agent")}
                            tooltip={{ children: "Train Your Agent" }}
                        >
                            <BrainCircuit />
                            <span>Train Your Agent</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
           <SidebarContent className="!flex-col justify-end !flex-1">
             <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard/my-orders">
                        <SidebarMenuButton isActive={pathname === '/dashboard/my-orders'}>
                            <Package />
                            <span>My Subscriptions</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/settings">
                        <SidebarMenuButton isActive={pathname === '/dashboard/settings'}>
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
             </SidebarMenu>
            </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
            </div>
            <UserNav />
          </header>
          <main className="flex-1 p-6 md:p-10 bg-muted/40">
            {isPageAllowed ? children : <AccessDenied status={approvalStatus} />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
