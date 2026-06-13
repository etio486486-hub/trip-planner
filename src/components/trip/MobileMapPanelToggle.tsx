"use client";

import { List, Map, Rows3 } from "lucide-react";
import type { MobilePanelFocus } from "./MobileBottomNav";

type MobileMapPanelToggleProps = {
  focus: MobilePanelFocus;
  onFocusChange: (focus: MobilePanelFocus) => void;
};

export function MobileMapPanelToggle({
  focus,
  onFocusChange,
}: MobileMapPanelToggleProps) {
  const btn = (id: MobilePanelFocus, label: string, Icon: typeof Map) => (
    <button
      key={id}
      type="button"
      onClick={() => onFocusChange(id)}
      className={`flex min-h-[44px] min-w-[3.75rem] flex-1 items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold transition-colors active:scale-[0.97] ${
        focus === id
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="pointer-events-auto flex w-full max-w-[17rem] gap-1 rounded-full border border-zinc-200/80 bg-white/95 p-1 shadow-lg shadow-black/10 backdrop-blur-sm">
      {btn("map", "지도", Map)}
      {btn("half", "반반", Rows3)}
      {btn("panel", "일정", List)}
    </div>
  );
}
