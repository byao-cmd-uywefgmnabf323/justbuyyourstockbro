"use client";

import React, { useState } from "react";

type InfoTooltipProps = {
  term: string; // e.g., "P/E Ratio"
  definition: string; // one-sentence plain-English definition
  href?: string; // link to Academy lesson
  className?: string;
};

export default function InfoTooltip({ term, definition, href, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  // Close on outside click (basic)
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest?.(".info-tooltip")) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <span className={`info-tooltip relative inline-flex items-center ${className || ""}`}>
      <button
        type="button"
        aria-label={`What is ${term}?`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-gray-600 text-[10px] leading-none bg-white hover:bg-gray-50"
        title={definition}
      >
        ?
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute z-20 mt-2 w-64 max-w-xs rounded border border-gray-300 bg-white p-2 text-xs text-black shadow-lg -left-1/2"
        >
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
