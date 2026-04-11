import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import SplashWrapper from "@/components/shared/splash-wrapper";
import LegacyCacheCleanup from "@/components/shared/legacy-cache-cleanup";

const AIChatbot = dynamic(() => import("@/components/shared/ai-chatbot"));

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "MG PRODUCTIONS — Premium E-Commerce",
  description: "Discover premium products curated for modern living. Shop electronics, fashion, home goods and more.",
  manifest: "/manifest.json?v=3",
  keywords: ["e-commerce", "premium", "shopping", "MG PRODUCTIONS", "modern"],
  authors: [{ name: "MG PRODUCTIONS Team" }],
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
        <Script id="mg-pwa-prompt-cache" strategy="beforeInteractive">
          {`
            (() => {
              if (typeof window === 'undefined') return;

              const promptWindow = window;
              const readyEventName = 'mg-beforeinstallprompt-ready';

              if (promptWindow.__mgPwaPromptBootstrapInstalled) return;
              promptWindow.__mgPwaPromptBootstrapInstalled = true;
              promptWindow.__mgDeferredPrompt = promptWindow.__mgDeferredPrompt ?? null;

              window.addEventListener('beforeinstallprompt', (event) => {
                event.preventDefault();
                promptWindow.__mgDeferredPrompt = event;
                window.dispatchEvent(new CustomEvent(readyEventName));
              });

              window.addEventListener('appinstalled', () => {
                promptWindow.__mgDeferredPrompt = null;
              });
            })();
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
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
