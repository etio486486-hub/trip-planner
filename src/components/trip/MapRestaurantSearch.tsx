"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Info,
  Loader2,
  MapPin,
  Plus,
  Search,
  Star,
  Utensils,
  X,
} from "lucide-react";
import {
  formatDistanceLabel,
  formatWalkTimeLabel,
  getPlacesRegionCenter,
  haversineMeters,
  searchRestaurants,
  sortRestaurantsByDistance,
  type RestaurantSearchResult,
} from "@/lib/maps/places-api";
import { isMapsConfigured } from "./MapsProvider";
import { useRestaurantMap } from "./RestaurantMapContext";
import type { Place } from "@/types/database";
import { RestaurantDetailModal } from "./RestaurantDetailModal";

const QUICK_TAGS = [
  { label: "라면", query: "라amen" },
  { label: "스시", query: "스시" },
  { label: "이자카야", query: "이자카야" },
  { label: "돈까스", query: "돈까스" },
  { label: "카페", query: "카페" },
] as const;

type MapRestaurantSearchProps = {
  places: Place[];
  focusedPlaceId: string | null;
};

export function MapRestaurantSearch({
  places,
  focusedPlaceId,
}: MapRestaurantSearchProps) {
  const {
    previewRestaurant,
    previewOnMap,
    clearPreview,
    addRestaurant,
    isAlreadyAdded,
  } = useRestaurantMap();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [anchorPlaceId, setAnchorPlaceId] = useState<string | null>(null);
  const [results, setResults] = useState<RestaurantSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] =
    useState<RestaurantSearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusedPlaceId) setAnchorPlaceId(focusedPlaceId);
  }, [focusedPlaceId]);

  const anchorPlace = useMemo(
    () => places.find((p) => p.id === anchorPlaceId) ?? null,
    [places, anchorPlaceId]
  );

  const searchCenter = useMemo(() => {
    if (anchorPlace) {
      return {
        latitude: anchorPlace.latitude,
        longitude: anchorPlace.longitude,
      };
    }
    return getPlacesRegionCenter(places);
  }, [anchorPlace, places]);

  const runSearch = useCallback(async () => {
    if (!isMapsConfigured()) return;

    setLoading(true);
    setError(null);

    try {
      let items = await searchRestaurants({
        query,
        latitude: searchCenter?.latitude,
        longitude: searchCenter?.longitude,
        radiusMeters: 4000,
        maxResults: 12,
        openNow: openNowOnly,
      });

      if (searchCenter) {
        items = sortRestaurantsByDistance(
          items,
          searchCenter.latitude,
          searchCenter.longitude
        );
      }

      setResults(items);
      if (items.length === 0) {
        setError(
          query.trim()
            ? openNowOnly
              ? "영업 중인 맛집을 찾지 못했습니다."
              : "검색 결과가 없습니다. 다른 키워드로 시도해 보세요."
            : searchCenter
              ? openNowOnly
                ? "주변에 영업 중인 맛집이 없습니다."
                : "주변 맛집을 찾지 못했습니다."
              : "일정에 장소를 추가하면 그 지역 맛집을 추천합니다."
        );
      }
    } catch {
      setError("맛집 검색에 실패했습니다.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, searchCenter, openNowOnly]);

  useEffect(() => {
    if (!open || !isMapsConfigured()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void runSearch();
    }, query.trim() ? 450 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, runSearch]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (detailTarget) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, detailTarget]);

  const handleAdd = async (item: RestaurantSearchResult) => {
    if (isAlreadyAdded(item.placeId)) return;

    setAddingId(item.placeId);
    try {
      await addRestaurant({
        name: item.name,
        google_place_id: item.placeId,
        latitude: item.latitude,
        longitude: item.longitude,
      });
    } finally {
      setAddingId(null);
    }
  };

  const getDistanceMeta = (item: RestaurantSearchResult) => {
    if (!searchCenter) return null;
    const meters = haversineMeters(
      searchCenter.latitude,
      searchCenter.longitude,
      item.latitude,
      item.longitude
    );
    return `${formatDistanceLabel(meters)} · ${formatWalkTimeLabel(meters)}`;
  };

  if (!isMapsConfigured()) return null;

  return (
    <>
      {open && (
        <div
          className="absolute inset-0 z-[15] bg-black/10 sm:bg-transparent"
          aria-hidden
        />
      )}

      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex justify-center px-3 max-lg:top-[max(0.5rem,env(safe-area-inset-top))] sm:top-4 sm:px-4"
      >
        <div className="pointer-events-auto w-full max-w-lg">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-3 py-2 shadow-lg shadow-black/10 ring-1 ring-black/5">
            <Utensils className="h-4 w-4 shrink-0 text-orange-500" />
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={
                searchCenter
                  ? "맛집·음식 검색..."
                  : "예: 후쿠오카 라amen, 텐jin 스시..."
              }
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-zinc-900 placeholder:text-zinc-400 outline-none sm:py-1 sm:text-sm"
            />
            {(query || open) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                  clearPreview();
                  inputRef.current?.blur();
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="검색 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {open && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xl shadow-black/15 ring-1 ring-black/5">
              {places.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-100 px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {places.map((place, index) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setAnchorPlaceId(place.id)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                        anchorPlaceId === place.id
                          ? "bg-blue-600 text-white ring-blue-600"
                          : "bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-blue-50"
                      }`}
                    >
                      {index + 1}번 · {place.name.length > 8 ? `${place.name.slice(0, 8)}…` : place.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-100 px-3 py-2.5">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => setQuery(tag.query)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors max-lg:py-2 ${
                      query === tag.query
                        ? "bg-orange-600 text-white ring-orange-600"
                        : "bg-zinc-50 text-orange-800 ring-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setOpenNowOnly((v) => !v)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                    openNowOnly
                      ? "bg-green-600 text-white ring-green-600"
                      : "bg-zinc-50 text-green-800 ring-green-200 hover:bg-green-50"
                  }`}
                >
                  영업 중
                </button>
              </div>

              {searchCenter && (
                <p className="flex items-center gap-1 border-b border-zinc-50 px-3 py-1.5 text-[10px] text-zinc-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {anchorPlace
                    ? `${places.findIndex((p) => p.id === anchorPlace.id) + 1}번 장소 주변 · 반경 4km`
                    : "현재 일정 지역 · 반경 4km"}
                  {openNowOnly ? " · 영업 중만" : ""}
                </p>
              )}

              <div className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    맛집 찾는 중...
                  </div>
                ) : results.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-zinc-500">
                    {error ?? "검색어를 입력하거나 태그를 선택하세요."}
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {results.map((item, index) => {
                      const isSelected =
                        previewRestaurant?.placeId === item.placeId;
                      const added = isAlreadyAdded(item.placeId);
                      const distanceMeta = getDistanceMeta(item);

                      return (
                        <li
                          key={item.placeId}
                          className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors ${
                            isSelected
                              ? "bg-orange-50 ring-1 ring-inset ring-orange-200"
                              : "hover:bg-zinc-50"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              isSelected
                                ? "bg-orange-600 text-white"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => previewOnMap(item)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-zinc-900">
                                {item.name}
                              </span>
                              {item.rating != null && (
                                <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-600">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {item.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
                              {item.reviewCount != null && (
                                <span>리뷰 {item.reviewCount.toLocaleString()}</span>
                              )}
                              {item.priceLevelLabel && (
                                <span className="font-medium text-zinc-600">
                                  {item.priceLevelLabel}
                                </span>
                              )}
                              {item.isOpenNow != null && (
                                <span
                                  className={
                                    item.isOpenNow
                                      ? "font-medium text-green-600"
                                      : "text-red-400"
                                  }
                                >
                                  {item.isOpenNow ? "영업 중" : "영업 종료"}
                                </span>
                              )}
                            </div>
                            {item.nameReadingKo && (
                              <p className="text-[11px] text-blue-600">
                                {item.nameReadingKo}
                              </p>
                            )}
                            {distanceMeta && (
                              <p className="mt-0.5 text-[11px] font-medium text-blue-600">
                                {distanceMeta}
                              </p>
                            )}
                            {item.address && (
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                                {item.address}
                              </p>
                            )}
                            {isSelected && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-orange-600">
                                <MapPin className="h-3 w-3" />
                                지도에서 위치 확인 중
                              </p>
                            )}
                          </button>
                          <div className="flex shrink-0 flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTarget(item)}
              className="flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 max-lg:min-h-[44px] max-lg:min-w-[44px]"
                              title="상세 정보"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                            {added ? (
                              <span className="flex items-center justify-center gap-0.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500">
                                <Check className="h-3 w-3" />
                                추가됨
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleAdd(item)}
                                disabled={addingId === item.placeId}
                                className="flex min-h-[44px] items-center gap-0.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                title="일정에 추가"
                              >
                                {addingId === item.placeId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                                추가
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {previewRestaurant && !open && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-20 flex justify-center px-3 max-lg:bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] sm:bottom-5">
          <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-xl shadow-black/15 ring-1 ring-black/5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {previewRestaurant.name}
              </p>
              {previewRestaurant.address && (
                <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                  {previewRestaurant.address}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setDetailTarget(previewRestaurant)}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 min-h-[44px] sm:min-h-0"
              >
                상세
              </button>
              {isAlreadyAdded(previewRestaurant.placeId) ? (
                <span className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500">
                  추가됨
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleAdd(previewRestaurant)}
                  disabled={addingId === previewRestaurant.placeId}
                  className="rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
                >
                  추가
                </button>
              )}
              <button
                type="button"
                onClick={clearPreview}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
                aria-label="미리보기 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <RestaurantDetailModal
        restaurant={detailTarget}
        onClose={() => setDetailTarget(null)}
        onAdd={
          detailTarget && !isAlreadyAdded(detailTarget.placeId)
            ? async () => {
                await handleAdd(detailTarget);
                setDetailTarget(null);
                clearPreview();
                setOpen(false);
              }
            : undefined
        }
      />
    </>
  );
}
