"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import type { useTripChecklist } from "@/hooks/useTripChecklist";
import type { useTripExpenses } from "@/hooks/useTripExpenses";
import {
  buildChecklistShareText,
  buildDayItineraryShareText,
  buildExpenseShareText,
  buildItineraryShareText,
  copyToClipboard,
  fetchAllPlacesByDay,
} from "@/lib/trip-share";
import type { DailyPlan, Place, Trip } from "@/types/database";
import type { TripMember } from "@/types/database";

type TripShareMenuProps = {
  trip: Trip | null;
  tripId: string;
  dailyPlans: DailyPlan[];
  selectedDayNumber: number;
  places: Place[];
  members: TripMember[];
  expenses: ReturnType<typeof useTripExpenses>;
  checklist: ReturnType<typeof useTripChecklist>;
  compact?: boolean;
};

export function TripShareMenu({
  trip,
  tripId,
  dailyPlans,
  selectedDayNumber,
  places,
  members,
  expenses,
  checklist,
  compact = false,
}: TripShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!trip) return null;

  const share = async (key: string, build: () => Promise<string> | string) => {
    setLoading(true);
    try {
      const text = await build();
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
      }
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: "day",
      label: `${selectedDayNumber}일차 일정`,
      action: () =>
        share("day", () =>
          buildDayItineraryShareText(trip, selectedDayNumber, places)
        ),
    },
    {
      key: "all",
      label: "전체 일정",
      action: () =>
        share("all", async () => {
          const map = await fetchAllPlacesByDay(tripId, dailyPlans);
          return buildItineraryShareText(trip, dailyPlans, map);
        }),
    },
    {
      key: "expense",
      label: "가계부·정산",
      action: () =>
        share("expense", () =>
          buildExpenseShareText(
            trip,
            expenses.expenses,
            members,
            tripId
          )
        ),
    },
    {
      key: "checklist",
      label: "체크리스트",
      action: () =>
        share("checklist", () =>
          buildChecklistShareText(trip, checklist.items)
        ),
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-lg font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 ${
          compact
            ? "px-2 py-1 text-[11px]"
            : "px-2.5 py-1.5 text-xs"
        }`}
      >
        <Share2 className="h-3.5 w-3.5" />
        공유
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={loading}
                onClick={item.action}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {item.label}
                {copied === item.key ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3 text-zinc-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
