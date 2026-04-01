import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/app/ui/theme-provider";
import { AppToaster } from "./toaster";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://edith-app.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "EDITH — The AI-Evaluated Plan Registry for Engineering Teams",
    template: "%s | EDITH",
  },
  description:
    "EDITH is an open-source registry of production-grade, AI-evaluated plan.md execution plans for software engineering agents. One champion plan per category. Tech-stack agnostic.",
  applicationName: "EDITH",
  authors: [{ name: "EDITH" }],
  creator: "EDITH",
  publisher: "EDITH",
  keywords: [
    "EDITH",
    "edith plan registry",
    "agentic workflows",
    "plan.md",
    "AI-evaluated plans",
    "software engineering agents",
    "developer workflows",
    "execution plans",
    "agentic AI",
    "plan registry",
    "AI code review",
    "tech-stack agnostic plans",
    "verified agentic workflows",
  ],
  openGraph: {
    title: "EDITH — The AI-Evaluated Plan Registry for Engineering Teams",
    description:
      "A curated, AI-evaluated collection of production-grade execution plans. One champion per category. Submit yours to compete.",
    siteName: "EDITH",
    type: "website",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "EDITH — The AI-Evaluated Plan Registry",
    description:
      "Open-source registry of AI-evaluated plan.md files. One champion per category. Tech-stack agnostic.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  other: {
    "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION ?? "",
  },
};

// JSON-LD structured data for search engines
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "EDITH",
  url: APP_URL,
  description:
    "An open-source registry of AI-evaluated, production-grade execution plans for software engineering agents.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <AppToaster />
      </body>
    </html>
  );
}
