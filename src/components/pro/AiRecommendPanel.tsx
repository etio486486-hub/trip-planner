"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { ProBadge } from "./ProBadge";
import { ProUpgradePanel } from "./ProUpgradePanel";
import { usePro } from "@/hooks/usePro";
import type { PlaceInput } from "@/types/database";

type AiPlace = { name: string; memo?: string };
type AiDay = { dayNumber: number; title?: string; places: AiPlace[] };

type AiRecommendPanelProps = {
  destination: string;
  dayCount: number;
  existingPlaceNames: string[];
  defaultLat: number;
  defaultLng: number;
  onAddPlaces: (places: PlaceInput[]) => Promise<void>;
  compact?: boolean;
};

export function AiRecommendPanel({
  destination,
  dayCount,
  existingPlaceNames,
  defaultLat,
  defaultLng,
  onAddPlaces,
  compact = false,
}: AiRecommendPanelProps) {
  const { hasFeature } = usePro();
  const canRecommend = hasFeature("ai_recommend");

  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState("맛집·카페·관광");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiDay[] | null>(null);

  if (!canRecommend) {
    return (
      <div className={compact ? "px-3 py-2" : "border-b border-zinc-100 px-4 py-3"}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg bg-violet-50 px-3 py-2.5 text-left text-xs font-semibold text-violet-800 ring-1 ring-violet-200"
        >
          <Sparkles className="h-4 w-4" />
          AI 일정·맛집 추천
          <ProBadge />
          <span className="ml-auto text-[10px] font-normal text-violet-600">
            {open ? "닫기" : "Pro"}
          </span>
        </button>
        {open && (
          <ProUpgradePanel featureId="ai_recommend" className="mt-2" compact />
        )}
      </div>
    );
  }

  const runRecommend = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: dayCount,
          preferences,
          existingPlaces: existingPlaceNames,
        }),
      });

      const data = (await res.json()) as {
        days?: AiDay[];
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "추천 실패");
        return;
      }

      setResult(data.days ?? []);
      setOpen(true);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  const addAllPlaces = async () => {
    if (!result?.length) return;
    setAdding(true);
    setError(null);

    try {
      const inputs: PlaceInput[] = [];
      for (const day of result) {
        for (const place of day.places) {
          inputs.push({
            name: place.name,
            latitude: defaultLat,
            longitude: defaultLng,
            memo: place.memo
              ? `[AI ${day.dayNumber}일차] ${place.memo}`
              : `[AI ${day.dayNumber}일차]`,
          });
        }
      }
      await onAddPlaces(inputs);
      setOpen(false);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={compact ? "px-3 py-2" : "border-b border-zinc-100 px-4 py-3"}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-violet-700 hover:to-indigo-700"
        >
          <Sparkles className="h-4 w-4" />
          AI 코스 추천
          <ProBadge />
        </button>
      ) : (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
              <Sparkles className="h-3.5 w-3.5" />
              AI 추천 · {destination}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setResult(null);
                setError(null);
              }}
              className="rounded p-1 text-violet-400 hover:bg-violet-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="mb-1 block text-[10px] font-medium text-violet-700">
            취향 (선택)
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="맛집·온천·쇼핑..."
            className="mb-2 w-full rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-xs"
          />

          {!result ? (
            <button
              type="button"
              onClick={() => void runRecommend()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중…
                </>
              ) : (
                `${dayCount}일 코스 추천 받기`
              )}
            </button>
          ) : (
            <>
              <ul className="mb-2 max-h-48 space-y-2 overflow-y-auto">
                {result.map((day) => (
                  <li
                    key={day.dayNumber}
                    className="rounded-lg bg-white p-2 text-xs ring-1 ring-violet-100"
                  >
                    <p className="font-bold text-violet-800">
                      {day.dayNumber}일차
                      {day.title ? ` · ${day.title}` : ""}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-zinc-700">
                      {day.places.map((p, i) => (
                        <li key={`${day.dayNumber}-${i}`}>
                          {i + 1}. {p.name}
                          {p.memo && (
                            <span className="text-zinc-500"> — {p.memo}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="mb-2 text-[10px] text-violet-600">
                추가 시 현재 선택된 일차에 순서대로 넣습니다. 지도 위치는
                장소 검색으로 보정해 주세요.
              </p>
              <button
                type="button"
                onClick={() => void addAllPlaces()}
                disabled={adding}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "일정에 추가"
                )}
              </button>
            </>
          )}

          {error && (
            <p className="mt-2 text-[11px] text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
