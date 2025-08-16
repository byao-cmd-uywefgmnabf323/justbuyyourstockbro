import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import "../styles/design-system.css";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/watchlist", label: "Watchlist", icon: "👀" },
  { href: "/backtest", label: "Backtest", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col py-8 px-4">
        <div className="font-extrabold text-blue-700 text-xl mb-10 tracking-tight">JustBuyYourStockBro</div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 font-medium text-slate-700">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100">
          <button className="w-full py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition">Log Out</button>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top nav */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between">
          <div className="font-semibold text-lg text-blue-700">Welcome back!</div>
          <div className="flex items-center gap-4">
            {/* Profile/avatar placeholder */}
            <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">U</div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
