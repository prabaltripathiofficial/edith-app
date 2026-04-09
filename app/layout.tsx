import type { Metadata } from "next";

import { ThemeProvider } from "@/app/ui/theme-provider";
import { AppToaster } from "./toaster";

import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://friday.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Friday | Enterprise Conversion Studio",
    template: "%s | Friday",
  },
  description:
    "Friday is a polished web workspace for converting HTML into visuals, rendering markdown like documentation, and handling everyday JSON, CSV, and URL transformations.",
  applicationName: "Friday",
  authors: [{ name: "Friday" }],
  creator: "Friday",
  publisher: "Friday",
  keywords: [
    "html preview tool",
    "markdown documentation viewer",
    "json formatter",
    "csv viewer",
    "url inspector",
    "developer workspace",
    "content transformation studio",
    "enterprise conversion tool",
  ],
  openGraph: {
    title: "Friday | Enterprise Conversion Studio",
    description:
      "A high-end content conversion workspace for HTML previews, markdown docs, and daily transformation tasks.",
    siteName: "Friday",
    type: "website",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Friday | Enterprise Conversion Studio",
    description:
      "Convert pasted HTML into visuals, render markdown as docs, and cover daily JSON, CSV, and URL workflows in one studio.",
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
  name: "Friday",
  url: APP_URL,
  description:
    "A content conversion workspace for HTML previews, markdown docs, JSON formatting, CSV review, and URL inspection.",
  applicationCategory: "BusinessApplication",
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
      className="h-full antialiased"
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
