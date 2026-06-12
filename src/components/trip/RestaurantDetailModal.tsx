"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Star,
  X,
} from "lucide-react";
import {
  fetchRestaurantPlaceDetails,
  type RestaurantPlaceDetails,
} from "@/lib/maps/places-api";

type RestaurantDetailModalProps = {
  placeId: string | null;
  onClose: () => void;
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm text-zinc-700">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
      <div>
        <p className="text-[11px] font-medium text-zinc-400">{label}</p>
        <p className="whitespace-pre-line">{value}</p>
      </div>
    </div>
  );
}

export function RestaurantDetailModal({
  placeId,
  onClose,
}: RestaurantDetailModalProps) {
  const [details, setDetails] = useState<RestaurantPlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) {
      setDetails(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRestaurantPlaceDetails(placeId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("음식점 정보를 불러올 수 없습니다.");
          setDetails(null);
          return;
        }
        setDetails(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError("음식점 정보를 불러올 수 없습니다.");
          setDetails(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  if (!placeId) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                정보 불러오는 중...
              </div>
            ) : details ? (
              <>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {details.name}
                </h2>
                {details.nameReadingKo && (
                  <p className="mt-0.5 text-sm text-blue-600">
                    읽기: {details.nameReadingKo}
                  </p>
                )}
                {details.rating != null && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">
                      {details.rating.toFixed(1)}
                    </span>
                    {details.reviewCount != null && (
                      <span className="text-zinc-400">
                        · 리뷰 {details.reviewCount.toLocaleString()}개
                      </span>
                    )}
                  </p>
                )}
                {details.isOpenNow != null && (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      details.isOpenNow ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {details.isOpenNow ? "영업 중" : "영업 종료"}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {details && !loading && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-3">
              <DetailRow icon={MapPin} label="주소" value={details.address} />
              <DetailRow icon={Phone} label="전화" value={details.phone} />
              <DetailRow
                icon={Clock}
                label="영업시간"
                value={details.openingHours}
              />
              {(details.priceLevelLabel || details.priceRangeText) && (
                <DetailRow
                  icon={Star}
                  label="가격대"
                  value={
                    [details.priceLevelLabel, details.priceRangeText]
                      .filter(Boolean)
                      .join(" · ") || null
                  }
                />
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
              {details.googleMapsUri && (
                <a
                  href={details.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <MapPin className="h-4 w-4" />
                  Google 지도에서 보기
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              )}
              {details.websiteUri && (
                <a
                  href={details.websiteUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <Globe className="h-4 w-4" />
                  웹사이트 방문
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
