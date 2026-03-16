import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nuclear Hustle - Nuclear Industry Jobs in the US",
  description: "Find jobs at nuclear power plants across the United States. Updated daily from major operators like Constellation, Duke Energy, Dominion, and more.",
  keywords: ["nuclear jobs", "nuclear power plant careers", "nuclear engineer jobs", "reactor operator jobs"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
        suppressHydrationWarning
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
