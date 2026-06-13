"use client";

import { type ComponentType } from "react";
import { Calculator, CheckSquare, Languages, Map } from "lucide-react";

export type SidebarTab = "itinerary" | "checklist" | "budget" | "translator";

type TripMenuTabsProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  compact?: boolean;
};

const TABS: {
  id: SidebarTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "itinerary", label: "일정", icon: Map },
  { id: "checklist", label: "체크리스트", icon: CheckSquare },
  { id: "budget", label: "가계부", icon: Calculator },
  { id: "translator", label: "번역", icon: Languages },
];

export function TripMenuTabs({
  activeTab,
  onTabChange,
  compact = false,
}: TripMenuTabsProps) {
  return (
    <div
      className={`flex overflow-x-auto bg-zinc-50/80 px-1 ${compact ? "" : "border-b border-zinc-200 px-2"}`}
    >
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`flex shrink-0 flex-1 items-center justify-center gap-1 border-b-2 font-medium transition-colors ${
            compact
              ? "min-h-[44px] min-w-[4.5rem] px-1 py-2 text-[11px]"
              : "min-h-[44px] min-w-[5rem] gap-1.5 px-2 py-2.5 text-xs"
          } ${
            activeTab === id
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
