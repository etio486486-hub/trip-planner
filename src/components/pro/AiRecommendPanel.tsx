"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { ProBadge } from "./ProBadge";
import { ProUpgradePanel } from "./ProUpgradePanel";
import { useFreemiumUsage } from "@/hooks/useFreemiumUsage";
import { FREE_AI_ADD_MAX_DAY, FREEMIUM_LIMITS } from "@/lib/freemium-limits";

type AiPlace = { name: string; memo?: string };
type AiDay = { dayNumber: number; title?: string; places: AiPlace[] };

type AiRecommendPanelProps = {
  destination: string;
  dayCount: number;
  existingPlaceNames: string[];
  defaultLat: number;
  defaultLng: number;
  onAddAiCourse: (
    days: AiDay[],
    ctx: {
      destination: string;
      defaultLat: number;
      defaultLng: number;
      maxDayNumber?: number;
    }
  ) => Promise<{ added: number; skipped: string[] }>;
  compact?: boolean;
};

export function AiRecommendPanel({
  destination,
  dayCount,
  existingPlaceNames,
  defaultLat,
  defaultLng,
  onAddAiCourse,
  compact = false,
}: AiRecommendPanelProps) {
  const { isPro, getSnapshot, refresh } = useFreemiumUsage();
  const aiUsage = getSnapshot("ai_recommend");
  const canRecommend = isPro || aiUsage.canUse;

  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState("맛집·카페·관광");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipNotice, setSkipNotice] = useState<string | null>(null);
  const [result, setResult] = useState<AiDay[] | null>(null);
  const [lastFreemium, setLastFreemium] = useState(false);

  const runRecommend = async () => {
    if (!canRecommend) {
      setError("이번 달 무료 AI 추천을 모두 사용했습니다.");
      return;
    }

    setLoading(true);
    setError(null);
    setSkipNotice(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: isPro ? dayCount : 1,
          preferences,
          existingPlaces: existingPlaceNames,
        }),
      });

      const data = (await res.json()) as {
        days?: AiDay[];
        error?: string;
        freemium?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? "추천 실패");
        return;
      }

      setResult(data.days ?? []);
      setLastFreemium(Boolean(data.freemium));
      setOpen(true);
      void refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  const addAllPlaces = async () => {
    if (!result?.length) return;
    setAdding(true);
    setGeocoding(true);
    setError(null);
    setSkipNotice(null);

    try {
      const summary = await onAddAiCourse(result, {
        destination,
        defaultLat,
        defaultLng,
        maxDayNumber: isPro ? undefined : FREE_AI_ADD_MAX_DAY,
      });

      if (summary.skipped.length > 0) {
        setSkipNotice(
          `${summary.added}곳 추가 · ${summary.skipped.length}곳 위치 미확인 (${summary.skipped.slice(0, 3).join(", ")}${summary.skipped.length > 3 ? "…" : ""})`
        );
      }

      if (summary.added > 0) {
        setOpen(false);
        setResult(null);
      } else {
        setError(
          "추가할 수 있는 장소가 없습니다. Google Maps API 키를 확인해 주세요."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setAdding(false);
      setGeocoding(false);
    }
  };

  const freemiumHint = FREEMIUM_LIMITS.ai_recommend.freeHint;

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
          {!isPro && <ProBadge />}
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
                setSkipNotice(null);
              }}
              className="rounded p-1 text-violet-400 hover:bg-violet-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isPro && (
            <p className="mb-2 text-[10px] text-violet-700">
              {freemiumHint}
              {!canRecommend && " · 이번 달 사용 완료"}
              {canRecommend && aiUsage.remaining > 0 && (
                <span> · 남은 횟수 {aiUsage.remaining}회</span>
              )}
            </p>
          )}

          {!canRecommend && (
            <ProUpgradePanel featureId="ai_recommend" className="mb-2" compact />
          )}

          <label className="mb-1 block text-[10px] font-medium text-violet-700">
            취향 (선택)
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="맛집·온천·쇼핑..."
            disabled={!canRecommend}
            className="mb-2 w-full rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-xs disabled:opacity-50"
          />

          {!result ? (
            <button
              type="button"
              onClick={() => void runRecommend()}
              disabled={loading || !canRecommend}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중…
                </>
              ) : isPro ? (
                `${dayCount}일 코스 추천 받기`
              ) : (
                "1일 코스 맛보기"
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
                Google Places로 실제 위치를 찾아{" "}
                <strong>{isPro ? "일차별" : "1일차"}</strong>로 추가합니다.
                {lastFreemium && " · 무료는 1일치만 추가됩니다."}
              </p>
              <button
                type="button"
                onClick={() => void addAllPlaces()}
                disabled={adding}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {geocoding ? "위치 확인 중…" : "추가 중…"}
                  </>
                ) : (
                  "일정에 추가"
                )}
              </button>
            </>
          )}

          {skipNotice && (
            <p className="mt-2 text-[11px] text-amber-700">{skipNotice}</p>
          )}
          {error && (
            <p className="mt-2 text-[11px] text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export type { AiDay };
