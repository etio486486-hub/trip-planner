"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { Trip } from "@/types/database";

type TripHeaderProps = {
  trip: Trip | null;
  onUpdate: (data: {
    title: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
};

export function TripHeader({ trip, onUpdate }: TripHeaderProps) {
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
      <div className="border-b border-zinc-200 px-4 py-4">
        <h1 className="text-lg font-bold text-zinc-900">여행 계획</h1>
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-200 px-4 py-4">
      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="여행 제목"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-blue-500"
            />
            <span className="text-xs text-zinc-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-blue-500"
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
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              저장
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-300 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <X className="h-3.5 w-3.5" />
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-zinc-900">
              {trip.title}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-600">
              {trip.start_date} ~ {trip.end_date}
            </p>
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="제목·날짜 편집"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
