"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Check, Compass, Pencil, X } from "lucide-react";
import {
  countTripDays,
  formatTripDateRange,
  getDestinationTheme,
} from "@/lib/trip-destination-theme";
import { markPreferHome } from "@/lib/trip-home-nav";
import type { Trip } from "@/types/database";

type TripHeaderProps = {
  trip: Trip | null;
  dayCount?: number;
  onUpdate: (data: {
    title: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
  compact?: boolean;
  rightActions?: ReactNode;
};

export function TripHeader({
  trip,
  dayCount,
  onUpdate,
  compact = false,
  rightActions,
}: TripHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!trip) return;
    setTitle(trip.title);
    setStartDate(trip.start_date);
    setEndDate(trip.end_date);
  }, [trip]);

  const theme = getDestinationTheme(trip?.title);
  const tripDays =
    dayCount ??
    (trip ? countTripDays(trip.start_date, trip.end_date) : 0);

  const startEdit = () => {
    if (!trip) return;
    setTitle(trip.title);
    setStartDate(trip.start_date);
    setEndDate(trip.end_date);
    setEditing(true);
  };

  const cancelEdit = () => {
    if (trip) {
      setTitle(trip.title);
      setStartDate(trip.start_date);
      setEndDate(trip.end_date);
    }
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!title.trim() || !startDate || !endDate) return;
    if (endDate < startDate) return;

    setSaving(true);
    try {
      await onUpdate({
        title: title.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!trip) {
    return (
      <div
        className={`shrink-0 border-b border-white/60 ${compact ? "px-3 py-3" : "px-4 py-4"}`}
      >
        <h1
          className={`text-center font-bold text-zinc-900 ${compact ? "text-base" : "text-lg"}`}
        >
          여행 계획
        </h1>
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden border-b border-white/70 ${compact ? "px-3 py-3" : "px-4 py-4"}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.07] ${theme.gradient}`}
      />
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />

      {editing ? (
        <div className="relative space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/80 bg-white/90 px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="여행 제목"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200/80 bg-white/90 px-2 py-2 text-xs text-zinc-900 outline-none focus:border-blue-400"
            />
            <span className="text-xs text-zinc-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="flex-1 rounded-xl border border-zinc-200/80 bg-white/90 px-2 py-2 text-xs text-zinc-900 outline-none focus:border-blue-400"
            />
          </div>
          {endDate < startDate && (
            <p className="text-xs text-red-500">
              종료일은 시작일 이후여야 합니다.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving || !title.trim() || endDate < startDate}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              저장
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white/80 py-2 text-xs font-medium text-zinc-600 hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Link
              href="/"
              onClick={() => markPreferHome()}
              className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-zinc-900"
              title="홈으로"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br text-white ${theme.gradient}`}
              >
                <Compass className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <span className="hidden sm:inline">Trip Planner</span>
            </Link>

            <div className="flex items-center gap-1">
              {rightActions}
              <button
                type="button"
                onClick={startEdit}
                className="rounded-xl border border-white/80 bg-white/70 p-2 text-zinc-500 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-zinc-800"
                title="제목·날짜 편집"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm backdrop-blur-sm">
              <span>{theme.emoji}</span>
              <span>{theme.label}</span>
              {tripDays > 0 && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span>{tripDays}일</span>
                </>
              )}
            </div>

            <h1
              className={`bg-gradient-to-r bg-clip-text font-bold tracking-tight text-transparent ${theme.gradient} ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}
            >
              {trip.title}
            </h1>

            <p
              className={`mt-1.5 inline-flex items-center justify-center gap-1.5 text-zinc-500 ${compact ? "text-[11px]" : "text-xs"}`}
            >
              <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
              {formatTripDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
