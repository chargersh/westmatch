import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site.config";
import Providers from "@/providers";
import "./globals.css";

const modernEra = localFont({
  src: "../../public/fonts/modern-era.woff2",
  variable: "--font-modern-era",
  display: "swap",
});

const tiempos = localFont({
  src: [
    {
      path: "../../public/fonts/tiempos-text-vf-roman.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/tiempos-text-vf-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-tiempos",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  creator: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.title,
  },
  icons: {
    apple: "/favicon/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="overscroll-none" lang="en" suppressHydrationWarning>
      <body
        className={`${modernEra.variable} ${tiempos.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
