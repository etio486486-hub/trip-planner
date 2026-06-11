"use client";

import { Car, Footprints, Loader2, Train } from "lucide-react";
import { useRouteLeg } from "@/hooks/useRouteLeg";
import type { Place } from "@/types/database";

type RouteSegmentInfoProps = {
  from: Place;
  to: Place;
  fromIndex: number;
  toIndex: number;
};

function TimeChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] text-zinc-700">
      <Icon className="h-3 w-3 shrink-0 text-zinc-500" />
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900">{value ?? "-"}</span>
    </span>
  );
}

export function RouteSegmentInfo({
  from,
  to,
  fromIndex,
  toIndex,
}: RouteSegmentInfoProps) {
  const { distance, taxi, transit, walking, loading, error } = useRouteLeg(
    from,
    to
  );

  return (
    <div className="mx-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2">
      <p className="mb-1.5 text-[11px] font-medium text-zinc-500">
        {fromIndex + 1}번 → {toIndex + 1}번 이동
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          경로 계산 중...
        </div>
      ) : error ? (
        <p className="text-[11px] text-zinc-400">{error}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {distance && (
            <p className="text-xs font-semibold text-zinc-800">
              거리 약 {distance}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <TimeChip icon={Car} label="택시" value={taxi} />
            <TimeChip icon={Train} label="지하철" value={transit} />
            <TimeChip icon={Footprints} label="도보" value={walking} />
          </div>
        </div>
      )}
    </div>
  );
}
