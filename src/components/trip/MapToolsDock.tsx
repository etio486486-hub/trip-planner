"use client";

import { useState } from "react";
import { CloudRain, Sparkles, Vote, WifiOff, X } from "lucide-react";
import {
  AiRecommendPanel,
  type AiDay,
} from "@/components/pro/AiRecommendPanel";
import { OfflinePackPanel } from "@/components/pro/OfflinePackPanel";
import { VotePanel } from "@/components/pro/VotePanel";
import { WeatherAiPanel } from "@/components/pro/WeatherAiPanel";
import type { DailyPlan, Place, Trip } from "@/types/database";

type ToolId = "ai" | "weather" | "offline" | "vote";

const TOOLS: Array<{
  id: ToolId;
  label: string;
  shortLabel: string;
  icon: typeof Sparkles;
  activeClass: string;
}> = [
  {
    id: "ai",
    label: "AI 코스",
    shortLabel: "AI",
    icon: Sparkles,
    activeClass: "from-violet-600 to-indigo-600",
  },
  {
    id: "weather",
    label: "날씨 AI",
    shortLabel: "날씨",
    icon: CloudRain,
    activeClass: "from-cyan-600 to-sky-600",
  },
  {
    id: "offline",
    label: "오프라인",
    shortLabel: "오프라인",
    icon: WifiOff,
    activeClass: "from-sky-600 to-blue-600",
  },
  {
    id: "vote",
    label: "투표",
    shortLabel: "투표",
    icon: Vote,
    activeClass: "from-violet-600 to-purple-600",
  },
];

type MapToolsDockProps = {
  destination: string;
  dayCount: number;
  selectedDayNumber: number;
  dayDate: string | null;
  places: Place[];
  trip: Trip | null;
  tripId: string;
  currentUserId: string;
  dailyPlans: DailyPlan[];
  mapCenter: { lat: number; lng: number };
  onAddAiCourse: (
    days: AiDay[],
    ctx: {
      destination: string;
      defaultLat: number;
      defaultLng: number;
      maxDayNumber?: number;
    }
  ) => Promise<{ added: number; skipped: string[] }>;
  isMobile?: boolean;
};

export function MapToolsDock({
  destination,
  dayCount,
  selectedDayNumber,
  dayDate,
  places,
  trip,
  tripId,
  currentUserId,
  dailyPlans,
  mapCenter,
  onAddAiCourse,
  isMobile = false,
}: MapToolsDockProps) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const toggleTool = (id: ToolId) => {
    setActiveTool((prev) => (prev === id ? null : id));
  };

  const activeMeta = TOOLS.find((t) => t.id === activeTool);

  return (
    <div
      className={`pointer-events-none absolute z-20 flex flex-col items-start ${
        isMobile
          ? "bottom-2 left-2 right-14 max-w-[calc(100%-3.5rem)]"
          : "bottom-4 left-4 right-28 max-w-[min(100%,28rem)]"
      }`}
    >
      {activeTool && activeMeta && (
        <div className="pointer-events-auto mb-2 w-full overflow-hidden rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
            <span className="text-xs font-bold text-zinc-800">
              {activeMeta.label}
            </span>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[min(42vh,300px)] overflow-y-auto overscroll-contain">
            {activeTool === "ai" && (
              <AiRecommendPanel
                key="ai"
                destination={destination}
                dayCount={dayCount}
                existingPlaceNames={places.map((p) => p.name)}
                defaultLat={mapCenter.lat}
                defaultLng={mapCenter.lng}
                onAddAiCourse={onAddAiCourse}
                embedded
                onDismiss={() => setActiveTool(null)}
              />
            )}
            {activeTool === "weather" && (
              <WeatherAiPanel
                destination={destination}
                dayNumber={selectedDayNumber}
                dayDate={dayDate}
                places={places}
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                compact
              />
            )}
            {activeTool === "offline" && (
              <OfflinePackPanel
                trip={trip}
                tripId={tripId}
                dailyPlans={dailyPlans}
                compact
              />
            )}
            {activeTool === "vote" && currentUserId && (
              <VotePanel
                tripId={tripId}
                currentUserId={currentUserId}
                compact
              />
            )}
          </div>
        </div>
      )}

      <div className="pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/95 p-1 shadow-lg ring-1 ring-black/5 backdrop-blur-md">
        {TOOLS.map(({ id, label, shortLabel, icon: Icon, activeClass }) => {
          const active = activeTool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleTool(id)}
              title={label}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-95 sm:px-3 sm:text-xs ${
                active
                  ? `bg-gradient-to-r text-white shadow-md ${activeClass}`
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}