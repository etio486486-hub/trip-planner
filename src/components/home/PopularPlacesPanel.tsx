"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, MapPin, Sparkles, Users } from "lucide-react";
import {
  buildGoogleMapsUrl,
  type PopularPlace,
} from "@/lib/popular-places";

export function PopularPlacesPanel() {
  const [places, setPlaces] = useState<PopularPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/popular-places");
        const data = (await res.json()) as { places?: PopularPlace[] };
        if (!cancelled) {
          setPlaces(data.places ?? []);
        }
      } catch {
        if (!cancelled) setPlaces([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          멤버들이 많이 가는 장소
        </div>
        <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          인기 장소 불러오는 중...
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-zinc-200 bg-white/80 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          멤버들이 많이 가는 장소
        </div>
        <p className="text-sm text-zinc-500">
          아직 공유할 만한 장소가 없어요. 여행 일정에 장소를 추가하면 다른
          멤버들과 추천 목록에 올라갑니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-800">
        <Sparkles className="h-4 w-4 text-amber-500" />
        멤버들이 많이 가는 장소
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        여행 플래너 이용자들의 일정에서 자주 등록된 장소예요
      </p>

      <ol className="space-y-2">
        {places.map((place) => (
          <li key={`${place.rank}-${place.name}`}>
            <a
              href={buildGoogleMapsUrl(place)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-lg border border-zinc-200/80 bg-white px-3 py-3 transition-colors hover:border-amber-300 hover:bg-amber-50/50"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  place.rank <= 3
                    ? "bg-amber-500 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {place.rank}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-zinc-900 group-hover:text-blue-700">
                    {place.name}
                  </p>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 group-hover:text-blue-600" />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    <Users className="h-3 w-3" />
                    {place.tripCount}개 여행
                  </span>
                  {place.visitCount > place.tripCount && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5">
                      <MapPin className="h-3 w-3" />
                      {place.visitCount}회 등록
                    </span>
                  )}
                </div>

                {place.sampleMemo && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500">
                    “{place.sampleMemo}”
                  </p>
                )}
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
