import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const interDisplay = Inter({
  variable: "--font-inter-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Apicus - AI-Powered Automation ROI Calculator",
    template: "%s | Apicus"
  },
  description: "Prove automation ROI in minutes with Apicus. Build visual workflows, calculate precise ROI, and justify automation projects with AI-powered insights. No spreadsheets, no guesswork.",
  keywords: [
    "automation ROI",
    "workflow automation",
    "ROI calculator",
    "business process automation",
    "Zapier ROI",
    "Make automation",
    "n8n workflows",
    "automation consulting",
    "process optimization",
    "AI-powered ROI",
    "workflow builder",
    "automation templates"
  ],
  authors: [{ name: "Apicus Team" }],
  creator: "Apicus",
  publisher: "Apicus",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://apicus.io"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://apicus.io",
    title: "Apicus - AI-Powered Automation ROI Calculator",
    description: "Prove automation ROI in minutes. Build visual workflows, calculate precise ROI, and justify automation projects with AI-powered insights.",
    siteName: "Apicus",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Apicus - Automation ROI Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apicus - AI-Powered Automation ROI Calculator",
    description: "Prove automation ROI in minutes. Build visual workflows, calculate precise ROI, and justify automation projects with AI-powered insights.",
    images: ["/og-image.png"],
    creator: "@apicus_io",
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${interDisplay.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
