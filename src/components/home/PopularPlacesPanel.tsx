"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, MapPin, Sparkles, Users } from "lucide-react";
import { HomeSidePanel } from "./HomeSidePanel";
import {
  buildGoogleMapsUrl,
  type PopularPlace,
} from "@/lib/popular-places";

type PopularPlacesPanelProps = {
  onClose?: () => void;
  className?: string;
};

export function PopularPlacesPanel({
  onClose,
  className,
}: PopularPlacesPanelProps) {
  const [places, setPlaces] = useState<PopularPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/popular-places");
        const data = (await res.json()) as { places?: PopularPlace[] };
        if (!cancelled) setPlaces(data.places ?? []);
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

  return (
    <HomeSidePanel
      title="멤버들이 많이 가는 장소"
      subtitle="여행 플래너 이용자 일정에서 자주 등록된 장소"
      icon={<Sparkles className="h-4 w-4" />}
      accent="amber"
      onClose={onClose}
      className={className}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12 text-xs text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-500" />
          불러오는 중...
        </div>
      ) : places.length === 0 ? (
        <p className="py-8 text-center text-xs leading-relaxed text-zinc-500">
          아직 등록된 장소가 없어요.
          <br />
          여행 일정에 장소를 추가하면 여기에 올라갑니다.
        </p>
      ) : (
        <ol className="space-y-2">
          {places.map((place) => (
            <li key={`${place.rank}-${place.name}`}>
              <a
                href={buildGoogleMapsUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded-xl border border-white/80 bg-white/70 px-2.5 py-2.5 transition-all hover:border-amber-200 hover:bg-white hover:shadow-sm"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    place.rank <= 3
                      ? "bg-amber-500 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {place.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-zinc-900 group-hover:text-amber-700">
                      {place.name}
                    </p>
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-zinc-300 group-hover:text-amber-500" />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800">
                      <Users className="h-2.5 w-2.5" />
                      {place.tripCount}개 여행
                    </span>
                    {place.visitCount > place.tripCount && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                        <MapPin className="h-2.5 w-2.5" />
                        {place.visitCount}회
                      </span>
                    )}
                  </div>
                  {place.sampleMemo && (
                    <p className="mt-1 line-clamp-1 text-[10px] text-zinc-500">
                      “{place.sampleMemo}”
                    </p>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ol>
      )}
    </HomeSidePanel>
  );
}
