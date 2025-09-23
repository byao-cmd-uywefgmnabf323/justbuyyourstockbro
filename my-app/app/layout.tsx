import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderClient from "@/components/HeaderClient";
import Footer from "@/components/Footer";
import Script from "next/script";

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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-background text-charcoal min-h-screen" suppressHydrationWarning>
        {/* Strip extension-injected attributes before hydration to avoid mismatches */}
        <Script id="strip-ext-attrs" strategy="beforeInteractive">
          {`
            (function(){
              try {
                var html = document.documentElement;
                if (!html) return;
                // Remove any attributes injected by extensions (e.g., data-windsurf-*)
                var attrs = Array.prototype.slice.call(html.attributes || []);
                for (var i=0; i<attrs.length; i++) {
                  var a = attrs[i];
                  if (a && typeof a.name === 'string' && a.name.indexOf('data-windsurf-') === 0) {
                    html.removeAttribute(a.name);
                  }
                }
              } catch (e) {}
            })();
          `}
        </Script>
        <HeaderClient />
        <main className="w-full max-w-laptop mx-auto px-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
