"use client";

import { Calculator, CheckSquare, Languages, Map, MapPin } from "lucide-react";
import { SIDEBAR_TABS, type SidebarTab } from "./TripMenuTabs";

export type MobilePanelFocus = "map" | "half" | "panel";

type MobileBottomNavProps = {
  activeTab: SidebarTab;
  panelFocus: MobilePanelFocus;
  onTabChange: (tab: SidebarTab) => void;
  onFocusMap: () => void;
  onFocusPanel: () => void;
};

const TAB_ICONS = {
  itinerary: MapPin,
  checklist: CheckSquare,
  budget: Calculator,
  translator: Languages,
} as const;

export function MobileBottomNav({
  activeTab,
  panelFocus,
  onTabChange,
  onFocusMap,
  onFocusPanel,
}: MobileBottomNavProps) {
  const mapActive = panelFocus === "map" || panelFocus === "half";

  return (
    <nav
      className="mobile-bottom-nav pointer-events-auto fixed inset-x-0 bottom-0 z-[42] border-t border-white/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_-8px_rgba(15,23,42,0.12)] backdrop-blur-xl"
      aria-label="여행 메뉴"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {SIDEBAR_TABS.map(({ id, label }) => {
          const Icon = TAB_ICONS[id];
          const active = activeTab === id && !mapActive;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onTabChange(id);
                onFocusPanel();
              }}
              className={`flex min-h-[52px] min-w-[4rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition active:scale-95 ${
                active
                  ? "text-blue-600"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${active ? "text-blue-600" : "text-zinc-500"}`}
              />
              <span className="leading-none">{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onFocusMap}
          className={`flex min-h-[52px] min-w-[4rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition active:scale-95 ${
            mapActive ? "text-indigo-600" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Map
            className={`h-5 w-5 ${mapActive ? "text-indigo-600" : "text-zinc-500"}`}
          />
          <span className="leading-none">지도</span>
        </button>
      </div>
    </nav>
  );
}
