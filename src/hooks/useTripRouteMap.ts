"use client";

import { useEffect, useState } from "react";
import { computeRouteLegDetails } from "@/lib/maps/routes-api";
import type { LatLng } from "@/lib/maps/polyline";
import {
  getSegmentColor,
  type RouteViewMode,
} from "@/lib/maps/segment-colors";
import type { Place } from "@/types/database";

export type MapRouteSegment = {
  index: number;
  color: string;
  path: LatLng[];
  fromName: string;
  toName: string;
};

function pathForMode(
  paths: { walk: LatLng[]; drive: LatLng[]; transit: LatLng[] },
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

export function useTripRouteMap(places: Place[], mode: RouteViewMode) {
  const [segments, setSegments] = useState<MapRouteSegment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (places.length < 2) {
      setSegments([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const results: MapRouteSegment[] = [];

      for (let i = 0; i < places.length - 1; i++) {
        const from = places[i];
        const to = places[i + 1];

        const details = await computeRouteLegDetails(
          { lat: from.latitude, lng: from.longitude },
          { lat: to.latitude, lng: to.longitude },
          to.name
        );

        if (cancelled) return;

        const path = details
          ? pathForMode(details.paths, mode)
          : [
              { lat: from.latitude, lng: from.longitude },
              { lat: to.latitude, lng: to.longitude },
            ];

        results.push({
          index: i,
          color: getSegmentColor(i),
          path,
          fromName: from.name,
          toName: to.name,
        });
      }

      if (!cancelled) {
        setSegments(results);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [places, mode]);

  return { segments, loading };
}
