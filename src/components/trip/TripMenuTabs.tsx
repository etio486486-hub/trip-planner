"use client";

import { type ComponentType } from "react";
import { Calculator, CheckSquare, Map } from "lucide-react";

export type SidebarTab = "itinerary" | "checklist" | "budget";

type TripMenuTabsProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
};

const TABS: {
  id: SidebarTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "itinerary", label: "일정", icon: Map },
  { id: "checklist", label: "체크리스트", icon: CheckSquare },
  { id: "budget", label: "가계부", icon: Calculator },
];

export function TripMenuTabs({ activeTab, onTabChange }: TripMenuTabsProps) {
  return (
    <div className="flex border-b border-zinc-200 bg-zinc-50/80 px-2">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-medium transition-colors ${
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
