"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";

type CollapsibleSectionProps = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  dense?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  dense = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-1.5 text-left transition hover:bg-white/50 active:bg-white/70 ${
          dense
            ? "min-h-[34px] px-2 py-1"
            : "min-h-[44px] gap-2 px-3.5 py-2.5"
        }`}
      >
        <Users
          className={`shrink-0 text-blue-500 ${dense ? "h-3 w-3" : "h-3.5 w-3.5"}`}
        />
        <span
          className={`font-semibold text-zinc-800 ${dense ? "text-[11px]" : "text-xs"}`}
        >
          {title}
        </span>
        {summary && (
          <span
            className={`min-w-0 flex-1 truncate text-zinc-500 ${dense ? "text-[10px]" : "text-xs"}`}
          >
            {summary}
          </span>
        )}
        <ChevronDown
          className={`shrink-0 text-zinc-400 transition-transform ${
            dense ? "h-3.5 w-3.5" : "h-4 w-4"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-white/50 bg-white/30 px-1 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}
