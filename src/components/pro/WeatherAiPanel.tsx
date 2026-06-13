"use client";

import { useEffect, useState } from "react";
import { CloudRain, Loader2, Sparkles } from "lucide-react";
import { fetchTripWeather, type DailyWeather } from "@/lib/weather-api";
import { ProBadge } from "./ProBadge";
import { ProUpgradePanel } from "./ProUpgradePanel";
import { useFreemiumUsage } from "@/hooks/useFreemiumUsage";
import type { Place } from "@/types/database";

type WeatherAiPanelProps = {
  destination: string;
  dayNumber: number;
  dayDate: string | null;
  places: Place[];
  latitude: number;
  longitude: number;
  compact?: boolean;
};

type AiResult = {
  summary: string;
  tips: string[];
  swaps: Array<{ from: string; to: string; reason: string }>;
  reorder: string[];
};

export function WeatherAiPanel({
  destination,
  dayNumber,
  dayDate,
  places,
  latitude,
  longitude,
  compact = false,
}: WeatherAiPanelProps) {
  const { isPro, getSnapshot, refresh } = useFreemiumUsage();
  const usage = getSnapshot("weather_ai_reschedule");
  const canUse = isPro || usage.canUse;

  const [weather, setWeather] = useState<DailyWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setWeatherLoading(true);
    void fetchTripWeather(latitude, longitude, 7)
      .then((days) => {
        if (cancelled) return;
        const byDate = dayDate
          ? days.find((d) => d.date === dayDate)
          : undefined;
        const target =
          byDate ?? days[dayNumber - 1] ?? days[0] ?? null;
        setWeather(target);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, dayNumber, dayDate]);

  const runAi = async () => {
    if (!weather || places.length === 0) {
      setError("일정 장소와 날씨 정보가 필요합니다.");
      return;
    }
    if (!canUse) {
      setError("이번 달 무료 날씨 AI 수정을 모두 사용했습니다.");
      return;
    }

    setAiLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/weather-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          dayNumber,
          dayDate: weather.date,
          weather,
          places: places.map((p) => ({ name: p.name, memo: p.memo })),
        }),
      });

      const data = (await res.json()) as AiResult & { error?: string };

      if (!res.ok) {
        setError(data.error ?? "AI 수정 실패");
        return;
      }

      setResult(data);
      void refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={compact ? "px-3 py-2" : "border-b border-white/60 px-4 py-3"}>
      <div className="rounded-xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-sky-50/50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-cyan-700" />
          <span className="text-xs font-bold text-cyan-900">
            날씨 AI 일정 수정
          </span>
          <ProBadge />
        </div>

        {weatherLoading ? (
          <p className="flex items-center gap-2 text-[11px] text-cyan-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            예보 불러오는 중…
          </p>
        ) : weather ? (
          <p className="mb-2 text-[11px] text-cyan-800">
            {dayNumber}일차 · {weather.date} · {weather.weatherLabel} · 최고{" "}
            {Math.round(weather.tempMaxC)}°C
            {weather.isRainy && " · ☔ 비 올 수 있어요"}
          </p>
        ) : (
          <p className="mb-2 text-[11px] text-cyan-700">
            날씨 예보를 불러올 수 없습니다.
          </p>
        )}

        {!isPro && (
          <p className="mb-2 text-[10px] text-cyan-700">
            무료: 월 1회
            {!canUse && " · 이번 달 사용 완료"}
            {canUse && usage.remaining > 0 && (
              <span> · 남은 {usage.remaining}회</span>
            )}
          </p>
        )}

        {!canUse && (
          <ProUpgradePanel featureId="weather_ai_reschedule" compact className="mb-2" />
        )}

        <button
          type="button"
          onClick={() => void runAi()}
          disabled={aiLoading || !canUse || !weather || places.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 py-2.5 text-xs font-semibold text-white hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50"
        >
          {aiLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 분석 중…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              날씨 반영 수정안 받기
            </>
          )}
        </button>

        {result && (
          <div className="mt-3 space-y-2 rounded-lg bg-white/80 p-2.5 text-xs ring-1 ring-cyan-100">
            {result.summary && (
              <p className="font-semibold text-cyan-900">{result.summary}</p>
            )}
            {result.tips.length > 0 && (
              <ul className="list-inside list-disc space-y-0.5 text-zinc-700">
                {result.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
            {result.swaps.length > 0 && (
              <div>
                <p className="mb-1 font-medium text-zinc-800">대체 제안</p>
                <ul className="space-y-1 text-zinc-600">
                  {result.swaps.map((s, i) => (
                    <li key={i}>
                      {s.from} → <strong>{s.to}</strong>
                      <span className="text-zinc-400"> ({s.reason})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.reorder.length > 0 && (
              <p className="text-zinc-600">
                추천 순서: {result.reorder.join(" → ")}
              </p>
            )}
          </div>
        )}

        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  );
}
