import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/sonner";
import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const font = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leolingo",
  description: "Learn, practice, and master new languages with Leolingo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Leolingo",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  other: {
    "google-adsense-account": "ca-pub-4456402604074753",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={font.className}>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4456402604074753"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
          <RegisterServiceWorker />
          <Toaster />
          <ExitModal />
          <HeartsModal />
          <PracticeModal />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
