"use client";

import { List, Map } from "lucide-react";

type MobileMapPanelToggleProps = {
  focus: "map" | "panel";
  onFocusChange: (focus: "map" | "panel") => void;
};

export function MobileMapPanelToggle({
  focus,
  onFocusChange,
}: MobileMapPanelToggleProps) {
  return (
    <div className="pointer-events-auto flex gap-1 rounded-full border border-zinc-200/80 bg-white/95 p-1 shadow-lg shadow-black/10 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onFocusChange("map")}
        className={`flex min-h-[44px] min-w-[4.5rem] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
          focus === "map"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <Map className="h-4 w-4" />
        지도
      </button>
      <button
        type="button"
        onClick={() => onFocusChange("panel")}
        className={`flex min-h-[44px] min-w-[4.5rem] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
          focus === "panel"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <List className="h-4 w-4" />
        일정
      </button>
    </div>
  );
}
