"use client";

import { useEffect, useState } from "react";
import {
  fetchRestaurantInfo,
  type RestaurantInfo,
} from "@/lib/maps/places-api";

export function useRestaurantInfo(googlePlaceId: string | null) {
  const [info, setInfo] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!googlePlaceId) {
      setInfo(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchRestaurantInfo(googlePlaceId)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [googlePlaceId]);

  return { info, loading };
}
