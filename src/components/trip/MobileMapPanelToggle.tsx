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
    <div className="pointer-events-auto flex gap-0.5 rounded-full bg-white p-0.5 shadow-md ring-1 ring-zinc-200">
      <button
        type="button"
        onClick={() => onFocusChange("map")}
        className={`flex min-h-[36px] items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium ${
          focus === "map"
            ? "bg-blue-600 text-white"
            : "text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <Map className="h-3.5 w-3.5" />
        지도
      </button>
      <button
        type="button"
        onClick={() => onFocusChange("panel")}
        className={`flex min-h-[36px] items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium ${
          focus === "panel"
            ? "bg-blue-600 text-white"
            : "text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        일정
      </button>
    </div>
  );
}
