"use client";

import { Minus, Plus } from "lucide-react";
import type { DailyPlan } from "@/types/database";

type DayTabsProps = {
  dailyPlans: DailyPlan[];
  selectedDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
  onAddDay: () => void;
  onRemoveDay: (dayNumber: number) => void;
  compact?: boolean;
};

export function DayTabs({
  dailyPlans,
  selectedDayNumber,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  compact = false,
}: DayTabsProps) {
  const canRemove = dailyPlans.length > 1;

  return (
    <div
      className={`shrink-0 border-b border-white/60 bg-white/40 backdrop-blur-sm ${
        compact ? "px-2 py-1" : "px-3 py-2.5"
      }`}
    >
      <div className="flex items-center gap-1 overflow-x-auto">
        {dailyPlans.map((plan) => {
          const active = selectedDayNumber === plan.day_number;
          return (
            <button
              key={`day-${plan.day_number}-${plan.id}`}
              type="button"
              onClick={() => onSelectDay(plan.day_number)}
              className={`shrink-0 rounded-full font-semibold transition-all active:scale-[0.97] ${
                compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-2 text-sm"
              } ${
                active
                  ? "trip-day-pill-active text-white"
                  : "bg-white/80 text-zinc-600 ring-1 ring-zinc-200/80 hover:bg-white hover:text-zinc-900"
              }`}
            >
              Day {plan.day_number}
            </button>
          );
        })}

        <div className="ml-auto flex shrink-0 items-center gap-0.5 pl-0.5">
          <button
            type="button"
            onClick={onAddDay}
            className={`flex items-center justify-center rounded-full bg-white/80 text-zinc-600 ring-1 ring-zinc-200/80 transition hover:bg-blue-50 hover:text-blue-600 ${
              compact ? "h-8 w-8" : "touch-min h-10 w-10"
            }`}
            title="일차 추가"
          >
            <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
          <button
            type="button"
            onClick={() => onRemoveDay(selectedDayNumber)}
            disabled={!canRemove}
            className={`flex items-center justify-center rounded-full bg-white/80 text-red-500 ring-1 ring-zinc-200/80 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-white ${
              compact ? "h-8 w-8" : "touch-min h-10 w-10"
            }`}
            title={
              canRemove
                ? `${selectedDayNumber}일차 제거`
                : "최소 1일차는 유지해야 합니다"
            }
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
