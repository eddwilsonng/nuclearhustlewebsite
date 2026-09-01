import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { ConditionalClicky } from "@/components/ConditionalClicky";
import { Clicky } from "@/components/Clicky";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nuclearhustle.com"),
  // Plain string (no template): every page sets its own full title including the
  // brand, so a "%s | Nuclear Hustle" template would append the brand a second
  // time (double brand). Title-less pages fall back to this string.
  title: "Nuclear Hustle — Nuclear Power Plant Jobs",
  description: "Find nuclear power plant jobs across the US. Updated daily from major operators.",
  keywords: ["nuclear jobs", "nuclear power plant careers", "nuclear engineer jobs", "reactor operator jobs"],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Nuclear Hustle",
    locale: "en_US",
    url: "https://www.nuclearhustle.com",
    title: "Nuclear Hustle — Nuclear Power Plant Jobs",
    description: "Find nuclear power plant jobs across the US. Updated daily from major operators.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Nuclear Hustle — Nuclear Power Plant Jobs" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nuclearhustle",
    title: "Nuclear Hustle — Nuclear Power Plant Jobs",
    description: "Find nuclear power plant jobs across the US. Updated daily from major operators.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen overflow-x-hidden bg-canvas text-ink antialiased`}
        suppressHydrationWarning
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebSiteSchema()) }} />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1" tabIndex={-1}>
          {children}
          </main>
          <ConditionalFooter>
            <Footer />
          </ConditionalFooter>
          <ConditionalClicky>
            <Clicky />
          </ConditionalClicky>
        </div>
      </body>
    </html>
  );
}
