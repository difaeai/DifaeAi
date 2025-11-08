
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/hooks/use-auth";

export const metadata: Metadata = {
  title: {
    default: "BERRETO: AI-Powered Security Solutions",
    template: "%s | BERRETO",
  },
  description: "BERRETO provides advanced AI security solutions for homes and businesses. Our DIFAE AI agent transforms your cameras into a proactive security network with real-time threat detection, smart alerts, and automated reporting. Secure your world with BERRETO.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
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

    