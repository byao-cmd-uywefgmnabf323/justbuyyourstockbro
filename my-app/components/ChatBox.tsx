"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
    const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const navigatedRef = useRef(false);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/anchor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].slice(-10) }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        const shouldRecommend = /<\s*recommend\b/i.test(data.reply);
        if (shouldRecommend) {
          if (navigatedRef.current) return; // prevent duplicate triggers
          navigatedRef.current = true;
          // Persist latest chat so /recommend can refetch if needed
          const latestChat = [...messages, userMsg].slice(-10);
          try { window.sessionStorage.setItem("jbysb_last_chat", JSON.stringify(latestChat)); } catch {}

          // Call recommendation endpoint with latest chat (include current user message)
          let saved = false;
          try {
            const r = await fetch("/api/ai/recommend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat: latestChat }),
            });
            const j = await r.json();
            if (Array.isArray(j.suggestions) && j.suggestions.length) {
              try { window.localStorage.setItem("jbysb_last_recs", JSON.stringify(j.suggestions)); } catch {}
              saved = true;
            }
          } catch {}
          if (!saved) {
            // Ensure key exists so /recommend doesn't show empty state without context
            try { window.localStorage.setItem("jbysb_last_recs", JSON.stringify([])); } catch {}
          }
          try { await router.push("/recommend"); } catch {}
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="w-full max-w-xl flex flex-col border border-gray-300 bg-white min-h-[70vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => {
          const display = m.role === "assistant" ? m.content.replace(/<\s*recommend\s*\/?>/ig, "").trim() : m.content;
          return (
            <div key={i} className={`${m.role === "user" ? "text-right" : "text-left"}`}>
              <div className={`inline-block px-3 py-2 rounded bg-${m.role === "user" ? "black text-white" : "gray-100 text-black"}`}>{display}</div>
            </div>
          );
        })}
        {loading && <div className="text-left text-sm text-gray-500">Anchor is typing…</div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-gray-300 p-3">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type your message…"
          className="w-full border border-gray-300 p-2 resize-none rounded-none focus:outline-none"
        />
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-black text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
