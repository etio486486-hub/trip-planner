"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <div className="border-b border-zinc-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[40px] items-center gap-2 px-3 py-2 text-left active:bg-zinc-50"
      >
        <span className="text-xs font-semibold text-zinc-700">{title}</span>
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
      {open && <div className="border-t border-zinc-100">{children}</div>}
    </div>
  );
}
