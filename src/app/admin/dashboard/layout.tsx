
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
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import {
  Home,
  Settings,
  LayoutTemplate,
  Users,
  ClipboardList,
  Camera,
  Video,
  ShieldAlert,
  Eye,
  FileText,
  Siren,
  Bot,
  ChevronDown,
  ShoppingCart,
  BrainCircuit
} from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

const navItems = [
  { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { href: "/admin/dashboard/users", icon: Users, label: "User Management" },
  { href: "/admin/dashboard/orders", icon: ShoppingCart, label: "Order Management" },
  { href: "/admin/dashboard/site-content", icon: LayoutTemplate, label: "Manage Website" },
];

const settingsSubItems = [
    { href: "/admin/dashboard/threat-detection", icon: Video, label: "Threat Detection" },
    { href: "/admin/dashboard/theft-alerts", icon: ShieldAlert, label: "Theft Alerts" },
    { href: "/admin/dashboard/visual-search", icon: Eye, label: "Difae EYE" },
    { href: "/admin/dashboard/reports", icon: FileText, label: "Security Reports" },
    { href: "/admin/dashboard/emergency-responders", icon: Siren, label: "Emergency Responders" },
    { href: "/admin/dashboard/cameras", icon: Camera, label: "Camera Management" },
];


export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  const isSettingsPathActive = pathname === "/admin/dashboard/settings" || settingsSubItems.some(item => pathname === item.href);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(isSettingsPathActive);
  
  React.useEffect(() => {
    if (!loading) {
      // If loading is finished and there's no user, or the user is not an admin, redirect.
      if (!user || user.email !== "admin@difaieai.com") {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);
  
  React.useEffect(() => {
    if (isSettingsPathActive) {
      if (!isSettingsOpen) setIsSettingsOpen(true);
    }
  }, [isSettingsPathActive, isSettingsOpen]);

  // Show a loading screen while auth state is being determined, or if the user is not the admin yet
  if (loading || !user || user.email !== "admin@difaieai.com") {
    return (
       <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <FirebaseErrorListener />
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold font-headline">
                BERRETO
              </span>
            </Link>
              <p className="text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">Admin Panel</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={{ children: item.label }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <SidebarMenuItem>
                <Link href="/admin/dashboard/agent">
                    <SidebarMenuButton
                        isActive={pathname === "/admin/dashboard/agent"}
                        tooltip={{ children: "Train the Agent" }}
                    >
                        <BrainCircuit />
                        <span>Train the Agent</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    isActive={isSettingsPathActive}
                >
                    <Settings />
                    <span>Settings</span>
                    <ChevronDown className={cn('ml-auto h-4 w-4 shrink-0 transition-transform duration-200', isSettingsOpen && 'rotate-180')} />
                </SidebarMenuButton>
            </SidebarMenuItem>
            {isSettingsOpen && (
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <Link href="/admin/dashboard/settings">
                            <SidebarMenuSubButton isActive={pathname === '/admin/dashboard/settings'}>General</SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                    {settingsSubItems.map(item => (
                        <SidebarMenuSubItem key={item.href}>
                            <Link href={item.href}>
                                <SidebarMenuSubButton isActive={pathname === item.href}>{item.label}</SidebarMenuSubButton>
                            </Link>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-10 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              {/* Optional: Add breadcrumbs or page title here */}
            </div>
            <AdminNav />
          </header>
          <main className="flex-1 p-6 md:p-10 bg-muted/40">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
