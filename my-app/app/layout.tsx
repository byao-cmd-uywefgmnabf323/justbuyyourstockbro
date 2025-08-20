import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JustBuyYourStockBro",
  description: "Minimalist stock recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-charcoal min-h-screen">
        {/* Live Market Bar removed for a cleaner top area */}
        {/* Global top header with explicit Dashboard button */}
        <header className="w-full border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="w-full max-w-laptop mx-auto px-4 h-12 flex items-center justify-between">
            <Link href="/recommend" className="font-semibold hover:underline">JustBuyYourStockBro</Link>
            <nav className="flex items-center gap-3">
              <Link
                href="/?intro=1"
                className="inline-flex items-center rounded-md border border-black px-3 py-1.5 text-sm font-medium text-black hover:bg-black/5"
              >
                Mission
              </Link>
              <Link
                href="/academy"
                className="inline-flex items-center rounded-md border border-black px-3 py-1.5 text-sm font-medium text-black hover:bg-black/5"
              >
                Academy
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/90"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="w-full max-w-laptop mx-auto px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
