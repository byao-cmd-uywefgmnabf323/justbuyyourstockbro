"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";

// Isolated controller to comply with Next.js Suspense requirement for useSearchParams
function IntroController({ setShow }: { setShow: (v: boolean) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    try {
      const w = typeof window !== 'undefined' ? window : undefined;
      const introDismissed = w ? w.sessionStorage.getItem("jbysb_intro_dismissed") : "1";
      const force = params?.get("intro") === "1";
      if (force) setShow(true); else setShow(introDismissed !== "1");
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  return null;
}

function ChatPageInternal() {
  const [showIntro, setShowIntro] = useState(false);

  const dismissIntro = () => {
    try {
      window.sessionStorage.setItem("jbysb_intro_dismissed", "1");
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('intro');
        window.history.replaceState({}, '', url.toString());
      }
    } catch { }
    setShowIntro(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <Suspense fallback={null}><IntroController setShow={setShowIntro} /></Suspense>
      {/* Mission Notice Box */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl bg-white border border-gray-300 shadow-2xl p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold text-black">Welcome to JustBuyYourStockBro</h2>
            </div>
            <div className="mt-3 text-base text-black space-y-3">
              <p><span className="font-semibold">Mission:</span> Help retail investors cut noise with personalized, explainable stock ideas and quick AI validation.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-semibold">Personalized Picks:</span> Survey your style, risk, horizon, sectors, and context to tailor recommendations.</li>
                <li><span className="font-semibold">Explainable Reasons:</span> Symbol pages include concise AI bullets under Key Stats.</li>
                <li><span className="font-semibold">Other Stocks:</span> Keep a broad universe visible for discovery, not just AI’s top picks.</li>
                <li><span className="font-semibold">AI Backtesting:</span> Try strategies on <a className="underline" href="/backtest">/backtest</a> for quick metrics (CAGR, Sharpe, drawdown).</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={dismissIntro} className="px-5 py-2 border border-gray-900 bg-black text-white rounded">Got it</button>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6 text-charcoal">JUST BUY YOUR STOCK BRO</h1>
      <ChatBox />
      <p className="mt-6 text-xs text-gray-500 max-w-xl text-center">
        Remember, Anchor is here for education and ideas, not financial advice. Perform your own research or consult a licensed advisor before investing.
      </p>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageInternal />
    </Suspense>
  );
}
