"use client";

import { Clock } from "lucide-react";
import type { Place } from "@/types/database";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function PlaceTimeline({ places }: { places: Place[] }) {
  const timed = places.filter((p) => p.visit_time);
  if (timed.length === 0) return null;

  return (
    <div className="mx-3 mb-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
        <Clock className="h-3 w-3" />
        오늘 타임라인
      </div>
      <div className="space-y-1">
        {timed.map((p) => {
          const end =
            p.duration_minutes && p.visit_time
              ? addMinutes(p.visit_time, p.duration_minutes)
              : null;
          return (
            <div
              key={p.id}
              className="flex items-baseline gap-2 text-[11px]"
            >
              <span className="shrink-0 font-mono font-medium text-blue-700">
                {p.visit_time}
                {end ? `–${end}` : ""}
              </span>
              <span className="truncate text-zinc-700">{p.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
