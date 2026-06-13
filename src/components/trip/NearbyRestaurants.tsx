"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  MapPin,
  Plus,
  Star,
  Utensils,
} from "lucide-react";
import { useNearbyRestaurants } from "@/hooks/useNearbyRestaurants";
import type { NearbyRestaurant } from "@/lib/maps/places-api";
import type { Place } from "@/types/database";
import { RestaurantDetailModal } from "./RestaurantDetailModal";
import { useRestaurantMapOptional } from "./RestaurantMapContext";

type NearbyRestaurantsProps = {
  place: Place;
  placeIndex: number;
};

export function NearbyRestaurants({ place, placeIndex }: NearbyRestaurantsProps) {
  const restaurantMap = useRestaurantMapOptional();
  const { restaurants, loading } = useNearbyRestaurants(
    place.latitude,
    place.longitude
  );
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<NearbyRestaurant | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handlePreview = (r: NearbyRestaurant) => {
    restaurantMap?.previewOnMap(r);
  };

  const handleAdd = async (r: NearbyRestaurant) => {
    if (!restaurantMap || restaurantMap.isAlreadyAdded(r.placeId)) return;

    setAddingId(r.placeId);
    try {
      await restaurantMap.addRestaurant({
        name: r.name,
        google_place_id: r.placeId,
        latitude: r.latitude,
        longitude: r.longitude,
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <>
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
            {restaurants.map((r, i) => {
              const added = restaurantMap?.isAlreadyAdded(r.placeId) ?? false;
              const isPreview =
                restaurantMap?.previewRestaurant?.placeId === r.placeId;

              return (
                <li
                  key={r.placeId}
                  className={`rounded-md bg-white px-2 py-1.5 shadow-sm ring-1 transition-colors ${
                    isPreview
                      ? "ring-orange-300 bg-orange-50/50"
                      : "ring-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreview(r)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-zinc-800">
                          {i + 1}. {r.name}
                        </span>
                        {r.rating != null && (
                          <span className="flex shrink-0 items-center gap-0.5 font-semibold text-amber-600">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {r.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-zinc-500">
                        {r.reviewCount != null && (
                          <span>리뷰 {r.reviewCount.toLocaleString()}</span>
                        )}
                        {r.priceLevelLabel && (
                          <span className="font-medium text-zinc-600">
                            {r.priceLevelLabel}
                          </span>
                        )}
                        {r.isOpenNow != null && (
                          <span
                            className={
                              r.isOpenNow ? "text-green-600" : "text-red-400"
                            }
                          >
                            {r.isOpenNow ? "영업 중" : "영업 종료"}
                          </span>
                        )}
                      </div>
                      {r.nameReadingKo && (
                        <p className="text-[10px] text-blue-600">
                          읽기: {r.nameReadingKo}
                        </p>
                      )}
                      {r.address && (
                        <p className="truncate text-[10px] text-zinc-500">
                          {r.address}
                        </p>
                      )}
                    </button>
                    <div className="flex shrink-0 flex-col gap-1.5 max-lg:gap-2">
                      {restaurantMap && (
                        <button
                          type="button"
                          onClick={() => handlePreview(r)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-orange-200 text-orange-600 hover:bg-orange-50"
                          title="지도에서 보기"
                        >
                          <MapPin className="h-3 w-3" />
                        </button>
                      )}
                      {added ? (
                        <span className="flex items-center justify-center gap-0.5 rounded-md bg-zinc-100 px-1.5 py-1 text-[10px] font-medium text-zinc-500">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : restaurantMap ? (
                        <button
                          type="button"
                          onClick={() => void handleAdd(r)}
                          disabled={addingId === r.placeId}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          title="일정에 추가"
                        >
                          {addingId === r.placeId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedRestaurant(r)}
                          className="rounded-md px-1.5 py-1 text-[10px] text-zinc-500 hover:bg-zinc-50"
                        >
                          상세
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        onAdd={
          selectedRestaurant &&
          restaurantMap &&
          !restaurantMap.isAlreadyAdded(selectedRestaurant.placeId)
            ? async () => {
                await handleAdd(selectedRestaurant);
                setSelectedRestaurant(null);
              }
            : undefined
        }
      />
    </>
  );
}
