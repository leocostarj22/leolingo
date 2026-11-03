import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/sonner";
import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const font = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leolingo",
  description: "Learn, practice, and master new languages with Leolingo",
  other: {
    "google-adsense-account": "ca-pub-4456402604074753",
  },
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
