"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MapPin,
  Plus,
  Search,
  Star,
  Utensils,
} from "lucide-react";
import {
  getPlacesRegionCenter,
  searchRestaurants,
  type RestaurantSearchResult,
} from "@/lib/maps/places-api";
import { isMapsConfigured } from "./MapsProvider";
import type { Place, PlaceInput } from "@/types/database";
import { RestaurantDetailModal } from "./RestaurantDetailModal";

const QUICK_TAGS = [
  { label: "라면", query: "라amen" },
  { label: "스시", query: "스시" },
  { label: "이자카야", query: "이자카야" },
  { label: "돈까스", query: "돈까스" },
  { label: "카페", query: "카페" },
] as const;

type RestaurantSearchProps = {
  places: Place[];
  onAdd: (place: PlaceInput) => Promise<void>;
  compact?: boolean;
};

export function RestaurantSearch({
  places,
  onAdd,
  compact = false,
}: RestaurantSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RestaurantSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [detailTarget, setDetailTarget] =
    useState<RestaurantSearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const regionCenter = useMemo(() => getPlacesRegionCenter(places), [places]);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      if (!isMapsConfigured()) return;

      setLoading(true);
      setError(null);

      try {
        const items = await searchRestaurants({
          query: searchQuery,
          latitude: regionCenter?.latitude,
          longitude: regionCenter?.longitude,
          radiusMeters: 4000,
          maxResults: 12,
        });
        setResults(items);
        if (items.length === 0) {
          setError(
            searchQuery.trim()
              ? "검색 결과가 없습니다. 다른 키워드로 시도해 보세요."
              : regionCenter
                ? "주변 맛집을 찾지 못했습니다."
                : "일정에 장소를 추가하면 그 지역 맛집을 추천합니다."
          );
        }
      } catch {
        setError("맛집 검색에 실패했습니다.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [regionCenter]
  );

  useEffect(() => {
    if (!isMapsConfigured()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, query.trim() ? 450 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const handleAdd = async (item: RestaurantSearchResult) => {
    setAddingId(item.placeId);
    try {
      await onAdd({
        name: item.name,
        google_place_id: item.placeId,
        latitude: item.latitude,
        longitude: item.longitude,
      });
    } finally {
      setAddingId(null);
    }
  };

  if (!isMapsConfigured()) return null;

  return (
    <>
      <div
        className={`border-b border-orange-100 bg-gradient-to-b from-orange-50/80 to-white ${
          compact ? "px-3 py-2" : "px-3 py-3"
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-2 flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-900">
            <Utensils className="h-3.5 w-3.5" />
            맛집 검색
          </span>
          <span className="text-[10px] text-orange-600/80">
            {expanded ? "접기" : "펼치기"}
          </span>
        </button>

        {expanded && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  regionCenter
                    ? "맛집 이름·음식 종류 검색..."
                    : "예: 후쿠오카 라amen, 텐jin 스시..."
                }
                className="w-full rounded-xl border border-orange-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {regionCenter && (
              <p className="mt-1.5 flex items-center gap-1 text-[10px] text-orange-700/70">
                <MapPin className="h-3 w-3 shrink-0" />
                현재 일정 지역 기준 · 반경 4km
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setQuery(tag.query)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 transition-colors ${
                    query === tag.query
                      ? "bg-orange-600 text-white ring-orange-600"
                      : "bg-white text-orange-800 ring-orange-200 hover:bg-orange-50"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            <div className="mt-2 max-h-52 overflow-y-auto overscroll-contain rounded-xl border border-orange-100 bg-white">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  맛집 찾는 중...
                </div>
              ) : results.length === 0 ? (
                <p className="px-3 py-4 text-center text-[11px] text-zinc-500">
                  {error ?? "검색어를 입력하거나 태그를 선택하세요."}
                </p>
              ) : (
                <ul className="divide-y divide-orange-50">
                  {results.map((item, index) => (
                    <li key={item.placeId} className="flex items-start gap-2 p-2">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailTarget(item)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-zinc-900">
                            {item.name}
                          </span>
                          {item.rating != null && (
                            <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {item.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {item.nameReadingKo && (
                          <p className="text-[10px] text-blue-600">
                            {item.nameReadingKo}
                          </p>
                        )}
                        {item.address && (
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-500">
                            {item.address}
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAdd(item)}
                        disabled={addingId === item.placeId}
                        className="flex shrink-0 items-center gap-0.5 rounded-lg bg-blue-600 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        title="일정에 추가"
                      >
                        {addingId === item.placeId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        추가
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && results.length > 0 && (
              <p className="mt-1 text-[10px] text-zinc-400">{error}</p>
            )}
          </>
        )}
      </div>

      <RestaurantDetailModal
        restaurant={detailTarget}
        onClose={() => setDetailTarget(null)}
        onAdd={
          detailTarget
            ? async () => {
                await handleAdd(detailTarget);
                setDetailTarget(null);
              }
            : undefined
        }
      />
    </>
  );
}
