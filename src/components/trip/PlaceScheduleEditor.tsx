"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, StickyNote } from "lucide-react";
import type { Place, PlaceScheduleUpdate } from "@/types/database";

type PlaceScheduleEditorProps = {
  place: Place;
  onSave: (placeId: string, data: PlaceScheduleUpdate) => Promise<void>;
};

export function PlaceScheduleEditor({
  place,
  onSave,
}: PlaceScheduleEditorProps) {
  const [visitTime, setVisitTime] = useState(place.visit_time ?? "");
  const [duration, setDuration] = useState(
    place.duration_minutes != null ? String(place.duration_minutes) : ""
  );
  const [memo, setMemo] = useState(place.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setVisitTime(place.visit_time ?? "");
    setDuration(
      place.duration_minutes != null ? String(place.duration_minutes) : ""
    );
    setMemo(place.memo ?? "");
  }, [place.id, place.visit_time, place.duration_minutes, place.memo]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const durationNum = duration.trim() ? Number(duration) : null;
      await onSave(place.id, {
        visit_time: visitTime.trim() || null,
        duration_minutes:
          durationNum != null && Number.isFinite(durationNum)
            ? Math.max(0, Math.round(durationNum))
            : null,
        memo: memo.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5">
      <p className="mb-2 truncate text-xs font-semibold text-blue-900">
        {place.name} · 일정 상세
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-zinc-500">
            <Clock className="h-3 w-3" />
            방문 시간
          </label>
          <input
            type="time"
            value={visitTime}
            onChange={(e) => setVisitTime(e.target.value)}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-zinc-500">
            체류 (분)
          </label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
          />
        </div>
      </div>
      <div className="mt-2">
        <label className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-zinc-500">
          <StickyNote className="h-3 w-3" />
          메모
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          placeholder="예약번호, 팁, 주의사항..."
          className="w-full resize-none rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
        />
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : saved ? (
          "저장됨"
        ) : (
          "저장"
        )}
      </button>
    </div>
  );
}
