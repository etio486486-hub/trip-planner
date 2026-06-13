"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MapPin,
  Plus,
  Search,
  Star,
  Utensils,
  X,
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

type MapRestaurantSearchProps = {
  places: Place[];
  onAdd: (place: PlaceInput) => Promise<void>;
};

export function MapRestaurantSearch({
  places,
  onAdd,
}: MapRestaurantSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<RestaurantSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] =
    useState<RestaurantSearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!open || !isMapsConfigured()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void runSearch(query);
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
      {open && (
        <div
          className="absolute inset-0 z-[15] bg-black/10 sm:bg-transparent"
          aria-hidden
        />
      )}

      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3 sm:top-4 sm:px-4"
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
                regionCenter
                  ? "맛집·음식 검색..."
                  : "예: 후쿠오카 라amen, 텐jin 스시..."
              }
              className="min-w-0 flex-1 bg-transparent py-1 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            {(query || open) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
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
              <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 px-3 py-2.5">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => setQuery(tag.query)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors ${
                      query === tag.query
                        ? "bg-orange-600 text-white ring-orange-600"
                        : "bg-zinc-50 text-orange-800 ring-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {regionCenter && (
                <p className="flex items-center gap-1 border-b border-zinc-50 px-3 py-1.5 text-[10px] text-zinc-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  현재 일정 지역 · 반경 4km
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
                    {results.map((item, index) => (
                      <li
                        key={item.placeId}
                        className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-zinc-50"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDetailTarget(item)}
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
                          {item.nameReadingKo && (
                            <p className="text-[11px] text-blue-600">
                              {item.nameReadingKo}
                            </p>
                          )}
                          {item.address && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                              {item.address}
                            </p>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAdd(item)}
                          disabled={addingId === item.placeId}
                          className="flex shrink-0 items-center gap-0.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
            </div>
          )}
        </div>
      </div>

      <RestaurantDetailModal
        restaurant={detailTarget}
        onClose={() => setDetailTarget(null)}
        onAdd={
          detailTarget
            ? async () => {
                await handleAdd(detailTarget);
                setDetailTarget(null);
                setOpen(false);
              }
            : undefined
        }
      />
    </>
  );
}
