"use client";

import { useState } from "react";
import { Check, Copy, FileDown, Image, Share2 } from "lucide-react";
import { usePro } from "@/hooks/usePro";
import { ProBadge } from "@/components/pro/ProBadge";
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
import {
  downloadShareTextAsImage,
  downloadShareTextAsPdf,
} from "@/lib/trip-export";
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
  const { hasFeature } = usePro();
  const canExport = hasFeature("pdf_export");

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

  const exportFile = async (
    key: string,
    title: string,
    build: () => Promise<string> | string,
    kind: "pdf" | "image"
  ) => {
    setLoading(true);
    try {
      const text = await build();
      if (kind === "pdf") {
        await downloadShareTextAsPdf(title, text);
      } else {
        await downloadShareTextAsImage(title, text);
      }
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
      setOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "내보내기 실패");
    } finally {
      setLoading(false);
    }
  };

  const copyItems = [
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
          buildExpenseShareText(trip, expenses.expenses, members, tripId)
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

  const exportItems = canExport
    ? [
        {
          key: "pdf-all",
          label: "전체 일정 PDF",
          icon: FileDown,
          action: () =>
            exportFile(
              "pdf-all",
              trip.title,
              async () => {
                const map = await fetchAllPlacesByDay(tripId, dailyPlans);
                return buildItineraryShareText(trip, dailyPlans, map);
              },
              "pdf"
            ),
        },
        {
          key: "pdf-expense",
          label: "가계부 PDF",
          icon: FileDown,
          action: () =>
            exportFile(
              "pdf-expense",
              `${trip.title} 가계부`,
              () =>
                buildExpenseShareText(
                  trip,
                  expenses.expenses,
                  members,
                  tripId
                ),
              "pdf"
            ),
        },
        {
          key: "img-day",
          label: `${selectedDayNumber}일차 이미지`,
          icon: Image,
          action: () =>
            exportFile(
              "img-day",
              `${trip.title} ${selectedDayNumber}일차`,
              () =>
                buildDayItineraryShareText(trip, selectedDayNumber, places),
              "image"
            ),
        },
      ]
    : [];

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
          <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              텍스트 복사
            </p>
            {copyItems.map((item) => (
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

            {canExport ? (
              <>
                <div className="my-1 border-t border-zinc-100" />
                <p className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                  Pro 내보내기
                  <ProBadge />
                </p>
                {exportItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={loading}
                    onClick={item.action}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <item.icon className="h-3.5 w-3.5 text-amber-600" />
                      {item.label}
                    </span>
                    {copied === item.key ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : null}
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="my-1 border-t border-zinc-100" />
                <p className="px-3 py-2 text-[10px] leading-relaxed text-zinc-500">
                  PDF·이미지 내보내기는 Pro 기능입니다.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
