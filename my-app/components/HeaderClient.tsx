"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function HeaderClient() {
  const pathname = usePathname();

  const navLinkClasses = "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const activeClasses = "bg-black text-white";
  const inactiveClasses = "bg-white text-black border border-black hover:bg-black/5";

  return (
    <header className="w-full border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full max-w-laptop mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-semibold hover:underline pointer-events-auto">JustBuyYourStockBro</Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/academy"
            className={clsx(navLinkClasses, pathname.startsWith('/academy') ? activeClasses : inactiveClasses)}
          >
            Academy
          </Link>
          <Link
            href="/market"
            className={clsx(navLinkClasses, pathname === '/market' ? activeClasses : inactiveClasses)}
          >
            Market
          </Link>
          <Link
            href="/dashboard"
            className={clsx(navLinkClasses, pathname === '/dashboard' ? activeClasses : inactiveClasses)}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

