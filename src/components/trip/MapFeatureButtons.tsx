"use client";

import { SIDEBAR_TABS, type SidebarTab } from "./TripMenuTabs";

type MapFeatureButtonsProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  layout?: "vertical" | "horizontal";
};

const TAB_ACCENTS: Record<SidebarTab, string> = {
  itinerary: "from-blue-600 to-indigo-600 shadow-blue-600/25",
  checklist: "from-emerald-500 to-teal-600 shadow-emerald-600/25",
  budget: "from-amber-500 to-orange-600 shadow-amber-600/25",
  translator: "from-violet-600 to-purple-600 shadow-violet-600/25",
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
          ? "absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-2"
          : "absolute inset-x-3 bottom-3 justify-center gap-2"
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
            className={`group flex items-center justify-center gap-1.5 rounded-2xl font-semibold backdrop-blur-xl transition-all active:scale-95 ${
              isVertical
                ? "min-w-[3.5rem] flex-col px-2.5 py-3 text-[10px]"
                : "min-h-[48px] flex-1 max-w-[5.75rem] flex-col px-1.5 py-2 text-[10px] sm:max-w-none sm:flex-row sm:px-3 sm:text-xs"
            } ${
              active
                ? `bg-gradient-to-br text-white shadow-lg ring-2 ring-white/40 ${TAB_ACCENTS[id]}`
                : "bg-white/90 text-zinc-700 shadow-md shadow-black/5 ring-1 ring-white/80 hover:bg-white hover:shadow-lg"
            }`}
          >
            <Icon
              className={`${isVertical ? "h-4 w-4" : "h-4 w-4 shrink-0"} ${
                active ? "text-white" : "text-zinc-600 group-hover:text-zinc-900"
              }`}
            />
            <span className="leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
