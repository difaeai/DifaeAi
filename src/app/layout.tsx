
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/hooks/use-auth";

export const metadata: Metadata = {
  title: {
    default: "DIFAE AI Security Cloud",
    template: "%s | DIFAE AI",
  },
  description:
    "DIFAE transforms your CCTV into a proactive AI security network with predictive monitoring, automated playbooks, and trusted evidence for every escalation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body text-text antialiased">
        <AuthProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}

    