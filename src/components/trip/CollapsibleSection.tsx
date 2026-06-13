"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";

type CollapsibleSectionProps = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[44px] items-center gap-2 px-3.5 py-2.5 text-left transition hover:bg-white/50 active:bg-white/70"
      >
        <Users className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        <span className="text-xs font-semibold text-zinc-800">{title}</span>
        {summary && (
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">
            {summary}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
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
