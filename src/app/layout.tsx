
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PT_Sans, Space_Grotesk, Source_Code_Pro } from "next/font/google";
import { AuthProvider } from "@/hooks/use-auth";

const ptSans = PT_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--font-pt-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-code-pro",
});

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
      <body
        className={`${ptSans.variable} ${spaceGrotesk.variable} ${sourceCodePro.variable} font-body antialiased`}
      >
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

    