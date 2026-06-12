"use client";

import { Loader2, Star, Utensils } from "lucide-react";
import { useNearbyRestaurants } from "@/hooks/useNearbyRestaurants";
import type { Place } from "@/types/database";

type NearbyRestaurantsProps = {
  place: Place;
  placeIndex: number;
};

export function NearbyRestaurants({ place, placeIndex }: NearbyRestaurantsProps) {
  const { restaurants, loading } = useNearbyRestaurants(
    place.latitude,
    place.longitude
  );

  return (
    <div className="mx-1 rounded-lg border border-orange-100 bg-orange-50/60 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-orange-800">
        <Utensils className="h-3.5 w-3.5" />
        {placeIndex + 1}번 주변 추천 음식점 (1km · 평점순)
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[11px] text-orange-600/70">
          <Loader2 className="h-3 w-3 animate-spin" />
          검색 중...
        </div>
      ) : restaurants.length === 0 ? (
        <p className="text-[11px] text-orange-700/70">
          주변 1km 내 추천 음식점을 찾지 못했습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {restaurants.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className="rounded-md bg-white px-2 py-1.5 text-[11px] shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-zinc-800">
                  {i + 1}. {r.name}
                </span>
                {r.rating != null && (
                  <span className="flex shrink-0 items-center gap-0.5 font-semibold text-amber-600">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {r.rating.toFixed(1)}
                  </span>
                )}
              </div>
              {r.reviewCount != null && (
                <p className="text-[10px] text-zinc-400">
                  리뷰 {r.reviewCount.toLocaleString()}개
                </p>
              )}
              {r.address && (
                <p className="truncate text-[10px] text-zinc-500">{r.address}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
