"use client";

import { SIDEBAR_TABS, type SidebarTab } from "./TripMenuTabs";

type MapFeatureButtonsProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  layout?: "vertical" | "horizontal";
};

export function MapFeatureButtons({
  activeTab,
  onTabChange,
  layout = "vertical",
}: MapFeatureButtonsProps) {
  const isVertical = layout === "vertical";

  return (
    <div
      className={`pointer-events-auto z-20 flex ${
        isVertical
          ? "absolute right-3 top-1/2 -translate-y-1/2 flex-col gap-2"
          : "absolute inset-x-3 bottom-3 justify-center gap-1.5"
      }`}
    >
      {SIDEBAR_TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            title={label}
            className={`flex items-center justify-center gap-1.5 rounded-xl font-semibold shadow-lg shadow-black/10 backdrop-blur-sm transition-all active:scale-95 ${
              isVertical
                ? "min-w-[3.25rem] flex-col px-2.5 py-2.5 text-[10px]"
                : "min-h-[44px] flex-1 max-w-[5.5rem] flex-col px-1 py-2 text-[10px] sm:max-w-none sm:flex-row sm:px-3 sm:text-xs"
            } ${
              active
                ? "bg-blue-600 text-white ring-2 ring-blue-400/50"
                : "bg-white/95 text-zinc-700 ring-1 ring-zinc-200/80 hover:bg-white"
            }`}
          >
            <Icon className={isVertical ? "h-4 w-4" : "h-4 w-4 shrink-0"} />
            <span className="leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
