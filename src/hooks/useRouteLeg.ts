"use client";

import { useEffect, useState } from "react";
import { computeRoute } from "@/lib/maps/routes-api";
import type { Place } from "@/types/database";

function isMapsConfigured(): boolean {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").startsWith("AIza");
}

export type RouteLegResult = {
  distance: string | null;
  taxi: string | null;
  transit: string | null;
  walking: string | null;
  loading: boolean;
  error: string | null;
};

const EMPTY: RouteLegResult = {
  distance: null,
  taxi: null,
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
        const [drive, walk] = await Promise.all([
          computeRoute(origin, destination, "DRIVE"),
          computeRoute(origin, destination, "WALK"),
        ]);

        let transit: Awaited<ReturnType<typeof computeRoute>> = null;
        try {
          transit = await computeRoute(origin, destination, "TRANSIT");
        } catch {
          transit = null;
        }

        if (cancelled) return;

        setResult({
          distance: drive?.distance ?? walk?.distance ?? null,
          taxi: drive?.duration ?? null,
          transit: transit?.duration ?? null,
          walking: walk?.duration ?? null,
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
    to?.id,
    to?.latitude,
    to?.longitude,
  ]);

  return result;
}
