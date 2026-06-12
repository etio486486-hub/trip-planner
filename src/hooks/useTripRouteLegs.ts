"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeRouteLegDetails,
  type RouteLegDetails,
} from "@/lib/maps/routes-api";
import type { LatLng } from "@/lib/maps/polyline";
import {
  getSegmentColor,
  type RouteViewMode,
} from "@/lib/maps/segment-colors";
import type { Place } from "@/types/database";

export type SegmentLegState = RouteLegDetails & {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  segmentIndex: number;
  loading: boolean;
  error: string | null;
};

export type MapRouteSegment = {
  index: number;
  fromId: string;
  toId: string;
  color: string;
  path: LatLng[];
  fromName: string;
  toName: string;
};

const EMPTY_LEG: RouteLegDetails = {
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
};

function isMapsConfigured(): boolean {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").startsWith("AIza");
}

function pathForMode(
  paths: RouteLegDetails["paths"],
  mode: RouteViewMode
): LatLng[] {
  switch (mode) {
    case "WALK":
      return paths.walk;
    case "DRIVE":
      return paths.drive;
    case "TRANSIT":
      return paths.transit;
  }
}

function buildPlacesKey(places: Place[]): string {
  return places
    .map((p) => `${p.id}:${p.latitude}:${p.longitude}:${p.name}`)
    .join("|");
}

export function getSegmentModeKey(fromId: string, toId: string): string {
  return `${fromId}::${toId}`;
}

export function getSegmentMode(
  segmentModes: Record<string, RouteViewMode>,
  fromId: string,
  toId: string
): RouteViewMode {
  return segmentModes[getSegmentModeKey(fromId, toId)] ?? "DRIVE";
}

/** 기본값 true — 명시적으로 false일 때만 숨김 */
export function isSegmentVisible(
  segmentVisibility: Record<string, boolean>,
  fromId: string,
  toId: string
): boolean {
  return segmentVisibility[getSegmentModeKey(fromId, toId)] !== false;
}

export function buildMapSegments(
  legs: SegmentLegState[],
  places: Place[],
  segmentModes: Record<string, RouteViewMode>
): MapRouteSegment[] {
  return legs.map((leg) => {
    const from = places[leg.segmentIndex];
    const to = places[leg.segmentIndex + 1];
    const mode = getSegmentMode(segmentModes, leg.fromId, leg.toId);
    const path =
      leg.error || leg.loading
        ? from && to
          ? [
              { lat: from.latitude, lng: from.longitude },
              { lat: to.latitude, lng: to.longitude },
            ]
          : []
        : pathForMode(leg.paths, mode);

    return {
      index: leg.segmentIndex,
      fromId: leg.fromId,
      toId: leg.toId,
      color: getSegmentColor(leg.segmentIndex),
      path,
      fromName: leg.fromName,
      toName: leg.toName,
    };
  });
}

export function useTripRouteLegs(places: Place[]) {
  const [legs, setLegs] = useState<SegmentLegState[]>([]);
  const [loading, setLoading] = useState(false);
  const placesKey = useMemo(() => buildPlacesKey(places), [places]);

  useEffect(() => {
    if (!isMapsConfigured() || places.length < 2) {
      setLegs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const results = await Promise.all(
        places.slice(0, -1).map(async (from, index) => {
          const to = places[index + 1];
          const base = {
            fromId: from.id,
            toId: to.id,
            fromName: from.name,
            toName: to.name,
            segmentIndex: index,
          };

          try {
            const details = await computeRouteLegDetails(
              { lat: from.latitude, lng: from.longitude },
              { lat: to.latitude, lng: to.longitude },
              to.name
            );

            if (!details) {
              return {
                ...EMPTY_LEG,
                ...base,
                loading: false,
                error: "경로 정보를 불러올 수 없습니다",
              };
            }

            return {
              ...details,
              ...base,
              loading: false,
              error: null,
            };
          } catch (err) {
            const message =
              err instanceof Error && err.message === "ROUTES_API_DISABLED"
                ? "Routes API가 비활성화되어 있습니다."
                : "경로 정보를 불러올 수 없습니다";

            return {
              ...EMPTY_LEG,
              ...base,
              loading: false,
              error: message,
            };
          }
        })
      );

      if (!cancelled) {
        setLegs(results);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [placesKey, places]);

  return { legs, loading };
}
