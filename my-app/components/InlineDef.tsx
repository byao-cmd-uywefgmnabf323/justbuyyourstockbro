"use client";

import React from "react";

type InlineDefProps = {
  label: string; // visible inline text the user hovers
  term: string; // heading in tooltip
  definition: string;
  href?: string;
  className?: string;
};

export default function InlineDef({ label, term, definition, href, className }: InlineDefProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ref.current && !ref.current.contains(t)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <span
      ref={ref}
      className={`relative inline-block ${className || ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="underline decoration-dotted underline-offset-2 cursor-help hover:opacity-90">
        {label}
      </span>
      {open && (
        <div className="absolute z-20 mt-1 w-64 max-w-xs rounded border border-gray-300 bg-white p-2 text-xs text-black shadow-lg left-1/2 -translate-x-1/2">
          <div className="font-semibold mb-1">{term}</div>
          <div className="text-gray-800">{definition}</div>
          {href && (
            <div className="mt-2">
              <a className="underline text-blue-700" href={href} target="_blank" rel="noopener noreferrer">
                Learn more →
              </a>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
