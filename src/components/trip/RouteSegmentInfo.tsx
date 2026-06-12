"use client";

import { useState } from "react";
import {
  Car,
  Copy,
  Footprints,
  Loader2,
  MessageCircle,
  Train,
} from "lucide-react";
import { useRouteLeg } from "@/hooks/useRouteLeg";
import {
  getSegmentColor,
  ROUTE_MODE_LABELS,
  type RouteViewMode,
} from "@/lib/maps/segment-colors";
import { toKoreanReading } from "@/lib/japanese-reading";
import type { Place } from "@/types/database";

type RouteSegmentInfoProps = {
  from: Place;
  to: Place;
  fromIndex: number;
  toIndex: number;
  routeViewMode: RouteViewMode;
  onRouteViewModeChange: (mode: RouteViewMode) => void;
};

function InfoRow({
  label,
  value,
  reading,
}: {
  label: string;
  value: string | null;
  reading?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="text-[11px] leading-relaxed text-zinc-600">
      <p>
        <span className="font-medium text-zinc-500">{label}</span> {value}
      </p>
      {reading && (
        <p className="mt-0.5 text-[10px] text-blue-600">읽기: {reading}</p>
      )}
    </div>
  );
}

function CopyablePhrase({
  text,
  reading,
}: {
  text: string;
  reading?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text.replace(/[「」]/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 ring-1 ring-amber-100">
      <MessageCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-amber-800">택시 멘트</p>
        <p className="break-words text-[11px] text-amber-900">{text}</p>
        {reading && (
          <p className="mt-0.5 break-words text-[10px] text-blue-600">
            읽기: {reading}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100"
      >
        <Copy className="h-3 w-3" />
      </button>
      {copied && <span className="text-[10px] text-amber-600">복사됨</span>}
    </div>
  );
}

function formatYen(yen: number | null): string | null {
  if (yen == null) return null;
  const krw = Math.round(yen * 9.2);
  return `약 ¥${yen.toLocaleString("ja-JP")} (₩${krw.toLocaleString("ko-KR")})`;
}

export function RouteSegmentInfo({
  from,
  to,
  fromIndex,
  toIndex,
  routeViewMode,
  onRouteViewModeChange,
}: RouteSegmentInfoProps) {
  const { distance, taxi, transit, walking, loading, error } = useRouteLeg(
    from,
    to
  );

  const segmentColor = getSegmentColor(fromIndex);

  return (
    <div
      className="mx-1 rounded-lg border border-dashed bg-zinc-50 px-3 py-2.5"
      style={{ borderColor: segmentColor }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold" style={{ color: segmentColor }}>
          {fromIndex + 1}번 → {toIndex + 1}번 이동
        </p>
        <div className="flex gap-0.5">
          {(["WALK", "DRIVE", "TRANSIT"] as RouteViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onRouteViewModeChange(m)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                routeViewMode === m
                  ? "bg-blue-600 text-white"
                  : "bg-white text-zinc-500 ring-1 ring-zinc-200"
              }`}
            >
              {ROUTE_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          경로·요금 계산 중...
        </div>
      ) : error ? (
        <p className="text-[11px] text-zinc-400">{error}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {distance && (
            <p className="text-xs font-semibold text-zinc-800">
              거리 약 {distance}
            </p>
          )}

          {(routeViewMode === "DRIVE" || routeViewMode === "WALK") && (
            <div className="rounded-md bg-white px-2.5 py-2 shadow-sm">
              <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-zinc-700">
                {routeViewMode === "DRIVE" ? (
                  <Car className="h-3 w-3" />
                ) : (
                  <Footprints className="h-3 w-3" />
                )}
                {ROUTE_MODE_LABELS[routeViewMode]} 경로 (도로 따라감)
              </div>
              <InfoRow
                label="시간:"
                value={routeViewMode === "DRIVE" ? taxi.duration : walking}
              />
              {routeViewMode === "DRIVE" && (
                <>
                  <InfoRow label="예상 요금:" value={formatYen(taxi.fareYen)} />
                  {taxi.phraseJa && (
                    <CopyablePhrase
                      text={taxi.phraseJa}
                      reading={taxi.phraseReadingKo}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {routeViewMode === "TRANSIT" && (
            <div className="rounded-md bg-white px-2.5 py-2 shadow-sm">
              <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-zinc-700">
                <Train className="h-3 w-3" />
                지하철·전철 (역↔역)
              </div>
              {transit ? (
                <>
                  <InfoRow label="총 시간:" value={transit.duration} />
                  <InfoRow
                    label="요금:"
                    value={transit.fareText ?? formatYen(transit.fareYen)}
                  />
                  {transit.steps.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {transit.steps.map((step, i) => (
                        <div
                          key={i}
                          className="rounded-md bg-blue-50 px-2 py-1.5 ring-1 ring-blue-100"
                        >
                          <p className="text-[11px] font-semibold text-blue-900">
                            {i + 1}구간 · {step.vehicleType ?? "대중교통"}{" "}
                            {step.lineShort ?? step.lineName}
                          </p>
                          <InfoRow
                            label="승차:"
                            value={step.boardStop}
                            reading={toKoreanReading(step.boardStop ?? "")}
                          />
                          <InfoRow
                            label="하차:"
                            value={step.alightStop}
                            reading={toKoreanReading(step.alightStop ?? "")}
                          />
                          <InfoRow
                            label="방향:"
                            value={step.headsign}
                            reading={toKoreanReading(step.headsign ?? "")}
                          />
                          <InfoRow label="시간:" value={step.duration} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <InfoRow label="노선:" value={transit.lineName} />
                      <InfoRow label="승차:" value={transit.boardStop} />
                      <InfoRow label="하차:" value={transit.alightStop} />
                    </>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-zinc-400">
                  지하철 경로를 찾을 수 없습니다.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
