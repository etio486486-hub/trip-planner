"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isPlaceAlreadyInItinerary,
  type RestaurantSearchResult,
} from "@/lib/maps/places-api";
import type { Place, PlaceInput } from "@/types/database";

type RestaurantMapContextValue = {
  previewRestaurant: RestaurantSearchResult | null;
  previewOnMap: (item: RestaurantSearchResult) => void;
  clearPreview: () => void;
  addRestaurant: (place: PlaceInput) => Promise<void>;
  isAlreadyAdded: (placeId: string) => boolean;
  focusMapOnMobile: () => void;
};

const RestaurantMapContext = createContext<RestaurantMapContextValue | null>(
  null
);

type RestaurantMapProviderProps = {
  places: Place[];
  onAddPlace: (place: PlaceInput) => Promise<void>;
  onFocusMap?: () => void;
  children: ReactNode;
};

export function RestaurantMapProvider({
  places,
  onAddPlace,
  onFocusMap,
  children,
}: RestaurantMapProviderProps) {
  const [previewRestaurant, setPreviewRestaurant] =
    useState<RestaurantSearchResult | null>(null);

  const itineraryGoogleIds = useMemo(
    () => places.map((p) => p.google_place_id),
    [places]
  );

  const isAlreadyAdded = useCallback(
    (placeId: string) =>
      isPlaceAlreadyInItinerary(placeId, itineraryGoogleIds),
    [itineraryGoogleIds]
  );

  const previewOnMap = useCallback(
    (item: RestaurantSearchResult) => {
      setPreviewRestaurant(item);
      onFocusMap?.();
    },
    [onFocusMap]
  );

  const clearPreview = useCallback(() => setPreviewRestaurant(null), []);

  const addRestaurant = useCallback(
    async (place: PlaceInput) => {
      await onAddPlace(place);
    },
    [onAddPlace]
  );

  const value = useMemo(
    () => ({
      previewRestaurant,
      previewOnMap,
      clearPreview,
      addRestaurant,
      isAlreadyAdded,
      focusMapOnMobile: () => onFocusMap?.(),
    }),
    [
      previewRestaurant,
      previewOnMap,
      clearPreview,
      addRestaurant,
      isAlreadyAdded,
      onFocusMap,
    ]
  );

  return (
    <RestaurantMapContext.Provider value={value}>
      {children}
    </RestaurantMapContext.Provider>
  );
}

export function useRestaurantMap() {
  const ctx = useContext(RestaurantMapContext);
  if (!ctx) {
    throw new Error("useRestaurantMap must be used within RestaurantMapProvider");
  }
  return ctx;
}

export function useRestaurantMapOptional() {
  return useContext(RestaurantMapContext);
}
