"use client";

import { useState } from "react";
import {
  Car,
  Copy,
  Footprints,
  Loader2,
  MessageCircle,
  Train,
  Utensils,
} from "lucide-react";
import { useRouteLeg } from "@/hooks/useRouteLeg";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import type { Place } from "@/types/database";

type RouteSegmentInfoProps = {
  from: Place;
  to: Place;
  fromIndex: number;
  toIndex: number;
};

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p className="text-[11px] leading-relaxed text-zinc-600">
      <span className="font-medium text-zinc-500">{label}</span> {value}
    </p>
  );
}

function CopyablePhrase({ text }: { text: string }) {
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
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100"
        title="복사"
      >
        <Copy className="h-3 w-3" />
      </button>
      {copied && (
        <span className="text-[10px] text-amber-600">복사됨</span>
      )}
    </div>
  );
}

function RestaurantBlock({ place }: { place: Place }) {
  const { info, loading } = useRestaurantInfo(place.google_place_id);

  if (loading) {
    return (
      <p className="text-[11px] text-zinc-400">식당 정보 불러오는 중...</p>
    );
  }

  if (!info) return null;

  return (
    <div className="rounded-md bg-orange-50 px-2.5 py-2 ring-1 ring-orange-100">
      <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-orange-800">
        <Utensils className="h-3 w-3" />
        {place.name} 식당 정보
      </div>
      <InfoRow label="가격대:" value={info.priceLevelLabel} />
      <InfoRow label="예상 메뉴 가격:" value={info.priceRangeText} />
      {!info.priceRangeText && !info.priceLevelLabel && (
        <p className="text-[11px] text-orange-700/80">
          구글에 등록된 메뉴 가격이 없습니다. 매장 메뉴판을 확인하세요.
        </p>
      )}
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
}: RouteSegmentInfoProps) {
  const { distance, taxi, transit, walking, loading, error } = useRouteLeg(
    from,
    to
  );

  return (
    <div className="mx-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <p className="mb-2 text-[11px] font-medium text-zinc-500">
        {fromIndex + 1}번 → {toIndex + 1}번 이동
      </p>

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

          <div className="rounded-md bg-white px-2.5 py-2 shadow-sm">
            <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-zinc-700">
              <Car className="h-3 w-3" />
              택시
            </div>
            <InfoRow label="시간:" value={taxi.duration} />
            <InfoRow label="예상 요금:" value={formatYen(taxi.fareYen)} />
            {taxi.phraseJa && <CopyablePhrase text={taxi.phraseJa} />}
            <p className="mt-1 text-[10px] text-zinc-400">{taxi.phraseKo}</p>
          </div>

          <div className="rounded-md bg-white px-2.5 py-2 shadow-sm">
            <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-zinc-700">
              <Train className="h-3 w-3" />
              지하철·전철
            </div>
            {transit ? (
              <>
                <InfoRow label="시간:" value={transit.duration} />
                <InfoRow
                  label="요금:"
                  value={
                    transit.fareText ??
                    formatYen(transit.fareYen)
                  }
                />
                <InfoRow label="노선:" value={transit.lineName} />
                <InfoRow label="승차:" value={transit.boardStop} />
                <InfoRow label="하차:" value={transit.alightStop} />
                {transit.headsign && (
                  <InfoRow label="방향:" value={transit.headsign} />
                )}
                {!transit.boardStop && !transit.duration && (
                  <p className="text-[11px] text-zinc-400">
                    이 구간은 대중교통 경로가 없습니다.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-zinc-400">
                지하철 경로를 찾을 수 없습니다.
              </p>
            )}
          </div>

          {walking && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-600">
              <Footprints className="h-3 w-3 text-zinc-400" />
              <span className="text-zinc-400">도보</span>
              <span className="font-medium">{walking}</span>
            </div>
          )}

          <RestaurantBlock place={to} />
        </div>
      )}
    </div>
  );
}
