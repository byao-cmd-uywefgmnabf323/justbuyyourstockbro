"use client";

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NewSessionButton from "./NewSessionButton";

export default function HeaderClient() {
  const pathname = usePathname();
  const isChatPage = pathname === '/';

  return (
    <header className="w-full border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full max-w-laptop mx-auto px-4 h-12 flex items-center justify-between">
        {isChatPage ? (
          <span className="font-semibold text-black cursor-default">JustBuyYourStockBro</span>
        ) : (
          <Link href="/" className="font-semibold hover:underline pointer-events-auto">JustBuyYourStockBro</Link>
        )}
        <nav className="flex items-center gap-3">
          <Link
            href="/academy"
            className="inline-flex items-center rounded-md border border-black px-3 py-1.5 text-sm font-medium text-black hover:bg-black/5"
          >
            Academy
          </Link>
          <NewSessionButton />
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/90"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

