"use client";

import { useState } from "react";
import { ExternalLink, Globe, Search } from "lucide-react";
import { HomeSidePanel } from "./HomeSidePanel";
import {
  buildTrendingMapsUrl,
  KOREA_TRENDING,
  OVERSEAS_TRENDING,
  withRanks,
  type TrendingPlace,
} from "@/lib/trending-places";

function TrendingList({ places }: { places: TrendingPlace[] }) {
  return (
    <ol className="space-y-2">
      {places.map((place) => (
        <li key={place.name}>
          <a
            href={buildTrendingMapsUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                place.rank <= 3
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {place.rank}
            </span>
            <span className="text-lg leading-none">{place.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900 group-hover:text-blue-700">
                {place.name}
              </p>
              <p className="truncate text-[10px] text-zinc-500">
                {place.region} · {place.tag}
              </p>
            </div>
            <ExternalLink className="h-3 w-3 shrink-0 text-zinc-300 group-hover:text-blue-500" />
          </a>
        </li>
      ))}
    </ol>
  );
}

type TrendingPlacesPanelProps = {
  onClose?: () => void;
  className?: string;
};

export function TrendingPlacesPanel({
  onClose,
  className,
}: TrendingPlacesPanelProps) {
  const [tab, setTab] = useState<"korea" | "overseas">("korea");
  const places = withRanks(
    tab === "korea" ? KOREA_TRENDING : OVERSEAS_TRENDING
  );

  return (
    <HomeSidePanel
      title="구글 인기 검색 여행지"
      subtitle="많은 사람들이 검색하는 대한민국 명소 & 해외 여행지"
      icon={<Search className="h-4 w-4" />}
      accent="blue"
      onClose={onClose}
      className={className}
    >
      <div className="mb-3 flex rounded-lg bg-white/60 p-0.5">
        <button
          type="button"
          onClick={() => setTab("korea")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
            tab === "korea"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          🇰🇷 대한민국
        </button>
        <button
          type="button"
          onClick={() => setTab("overseas")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
            tab === "overseas"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Globe className="h-3 w-3" />
          해외 여행
        </button>
      </div>

      <TrendingList places={places} />

      <p className="mt-3 text-center text-[10px] text-zinc-400">
        Google 검색 트렌드 기반 추천 · 지도에서 자세히 보기
      </p>
    </HomeSidePanel>
  );
}
