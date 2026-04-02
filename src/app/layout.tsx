import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import SplashWrapper from "@/components/shared/splash-wrapper";
import AIChatbot from "@/components/shared/ai-chatbot";
import LegacyCacheCleanup from "@/components/shared/legacy-cache-cleanup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MG PRODUCTIONS — Premium E-Commerce",
  description: "Discover premium products curated for modern living. Shop electronics, fashion, home goods and more.",
  keywords: ["e-commerce", "premium", "shopping", "MG PRODUCTIONS", "modern"],
  authors: [{ name: "MG PRODUCTIONS Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MG PRODUCTIONS",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "MG PRODUCTIONS — Premium E-Commerce",
    description: "Discover premium products curated for modern living.",
    type: "website",
    locale: "id_ID",
    siteName: "MG PRODUCTIONS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <LegacyCacheCleanup />
        <SplashWrapper>{children}</SplashWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 10, 30, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              color: '#f0e6ff',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
        <AIChatbot />
      </body>
    </html>
  );
}
