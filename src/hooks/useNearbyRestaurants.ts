"use client";

import { useEffect, useState } from "react";
import {
  fetchNearbyRestaurants,
  type NearbyRestaurant,
} from "@/lib/maps/places-api";

export function useNearbyRestaurants(latitude: number, longitude: number) {
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchNearbyRestaurants(latitude, longitude, 1000)
      .then((data) => {
        if (!cancelled) setRestaurants(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  return { restaurants, loading };
}
