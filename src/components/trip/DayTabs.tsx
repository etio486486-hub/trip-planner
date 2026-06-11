"use client";

import { Minus, Plus } from "lucide-react";
import type { DailyPlan } from "@/types/database";

type DayTabsProps = {
  dailyPlans: DailyPlan[];
  selectedDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
  onAddDay: () => void;
  onRemoveDay: (dayNumber: number) => void;
};

export function DayTabs({
  dailyPlans,
  selectedDayNumber,
  onSelectDay,
  onAddDay,
  onRemoveDay,
}: DayTabsProps) {
  const canRemove = dailyPlans.length > 1;

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 px-3 py-2">
      {dailyPlans.map((plan) => (
        <button
          key={`day-${plan.day_number}-${plan.id}`}
          type="button"
          onClick={() => onSelectDay(plan.day_number)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedDayNumber === plan.day_number
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
          }`}
        >
          {plan.day_number}일차
        </button>
      ))}
      <button
        type="button"
        onClick={onAddDay}
        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
        title="일차 추가"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onRemoveDay(selectedDayNumber)}
        disabled={!canRemove}
        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
        title={
          canRemove
            ? `${selectedDayNumber}일차 제거`
            : "최소 1일차는 유지해야 합니다"
        }
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}
