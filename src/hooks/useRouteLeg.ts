"use client";

import { useEffect, useState } from "react";
import {
  computeRouteLegDetails,
  type RouteLegDetails,
} from "@/lib/maps/routes-api";
import type { Place } from "@/types/database";

function isMapsConfigured(): boolean {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").startsWith("AIza");
}

export type RouteLegResult = RouteLegDetails & {
  loading: boolean;
  error: string | null;
};

const EMPTY: RouteLegResult = {
  distance: null,
  distanceMeters: null,
  paths: { walk: [], drive: [], transit: [] },
  taxi: {
    duration: null,
    fareYen: null,
    phraseJa: "",
    phraseKo: "",
    phraseReadingKo: "",
  },
  transit: null,
  walking: null,
  loading: false,
  error: null,
};

export function useRouteLeg(
  from: Place | null,
  to: Place | null
): RouteLegResult {
  const [result, setResult] = useState<RouteLegResult>(EMPTY);

  useEffect(() => {
    if (!isMapsConfigured() || !from || !to) {
      setResult(EMPTY);
      return;
    }

    let cancelled = false;
    setResult({ ...EMPTY, loading: true });

    const origin = { lat: from.latitude, lng: from.longitude };
    const destination = { lat: to.latitude, lng: to.longitude };

    const load = async () => {
      try {
        const details = await computeRouteLegDetails(
          origin,
          destination,
          from.name,
          to.name
        );

        if (cancelled) return;

        if (!details) {
          setResult({
            ...EMPTY,
            loading: false,
            error: "경로 정보를 불러올 수 없습니다",
          });
          return;
        }

        setResult({
          ...details,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error && err.message === "ROUTES_API_DISABLED"
            ? "Routes API가 비활성화되어 있습니다. Google Cloud에서 Routes API를 켜주세요."
            : "경로 정보를 불러올 수 없습니다";

        setResult({
          ...EMPTY,
          loading: false,
          error: message,
        });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    from?.id,
    from?.latitude,
    from?.longitude,
    from?.name,
    to?.id,
    to?.latitude,
    to?.longitude,
    to?.name,
  ]);

  return result;
}
