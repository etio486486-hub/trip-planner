"use client";

import { useState } from "react";
import { Download, Loader2, WifiOff } from "lucide-react";
import { downloadOfflinePack } from "@/lib/offline-pack";
import { ProBadge } from "./ProBadge";
import { ProUpgradePanel } from "./ProUpgradePanel";
import { usePro } from "@/hooks/usePro";
import type { DailyPlan, Trip } from "@/types/database";

type OfflinePackPanelProps = {
  trip: Trip | null;
  tripId: string;
  dailyPlans: DailyPlan[];
  compact?: boolean;
};

export function OfflinePackPanel({
  trip,
  tripId,
  dailyPlans,
  compact = false,
}: OfflinePackPanelProps) {
  const { hasFeature } = usePro();
  const isPro = hasFeature("offline_pack");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!trip) return null;

  const handleDownload = async (preview: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await downloadOfflinePack({
        trip,
        dailyPlans,
        tripId,
        maxDayNumber: preview ? 1 : undefined,
        watermark: preview,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "다운로드 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? "px-3 py-2" : "border-b border-white/60 px-4 py-3"}>
      <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-blue-50/50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-sky-700" />
          <span className="text-xs font-bold text-sky-900">오프라인 팩</span>
          <ProBadge />
        </div>
        <p className="mb-2 text-[10px] leading-relaxed text-sky-800/90">
          일정·좌표·통역 문장을 HTML로 저장. 지하철·외곽에서 Wi-Fi 없이 열람.
        </p>

        {isPro ? (
          <button
            type="button"
            onClick={() => void handleDownload(false)}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-sky-700 hover:to-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            전체 오프라인 팩 받기
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void handleDownload(true)}
              disabled={loading}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              1일치 미리보기
            </button>
            <ProUpgradePanel featureId="offline_pack" compact />
          </>
        )}

        {error && (
          <p className="mt-2 text-[11px] text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
