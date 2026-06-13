"use client";

import { useEffect, useMemo, useState } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import type { MapRouteSegment } from "@/hooks/useTripRouteLegs";
import { groupPlacesForMarkers } from "@/lib/map-markers";
import type { RestaurantSearchResult } from "@/lib/maps/places-api";
import { isMapsConfigured } from "./MapsProvider";
import { MapsSetupGuide } from "./MapsSetupGuide";
import { MapRestaurantSearch } from "./MapRestaurantSearch";
import type { Place, PlaceInput } from "@/types/database";

const MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim() || "DEMO_MAP_ID";

type TripMapProps = {
  places: Place[];
  focusedPlaceId: string | null;
  routeSegments: MapRouteSegment[];
  routesLoading?: boolean;
  onPlaceClick?: (placeId: string) => void;
  onAddPlace?: (place: PlaceInput) => Promise<void>;
};

function SegmentPolylines({ segments }: { segments: MapRouteSegment[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const polylines = segments
      .filter((s) => s.path.length >= 2)
      .map((segment) => {
        const polyline = new google.maps.Polyline({
          path: segment.path,
          geodesic: false,
          strokeColor: segment.color,
          strokeOpacity: 0.9,
          strokeWeight: 5,
          zIndex: 10 + segment.index,
        });
        polyline.setMap(map);
        return polyline;
      });

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, segments]);

  return null;
}

function PlaceMarkers({
  places,
  focusedPlaceId,
  onPlaceClick,
}: {
  places: Place[];
  focusedPlaceId: string | null;
  onPlaceClick?: (placeId: string) => void;
}) {
  const groups = useMemo(() => groupPlacesForMarkers(places), [places]);

  return (
    <>
      {groups.map((group) => {
        const isFocused = group.items.some(
          (item) => item.place.id === focusedPlaceId
        );
        const title = group.items
          .map((item) => `${item.number}. ${item.place.name}`)
          .join(" · ");
        const markerKey = group.items.map((item) => item.place.id).join("-");

        return (
          <AdvancedMarker
            key={markerKey}
            position={{ lat: group.lat, lng: group.lng }}
            title={title}
            zIndex={isFocused ? 1000 : group.items[0].number}
            onClick={() => {
              const target =
                group.items.find((item) => item.place.id === focusedPlaceId)
                  ?.place.id ?? group.items[0].place.id;
              onPlaceClick?.(target);
            }}
          >
            <div
              className={`flex items-center gap-0.5 ${onPlaceClick ? "cursor-pointer" : ""}`}
            >
              {group.items.map((item) => (
                <div
                  key={item.place.id}
                  className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1 text-xs font-bold text-white shadow-md ${
                    item.place.id === focusedPlaceId ||
                    (isFocused && group.items.length === 1)
                      ? "bg-blue-700 ring-2 ring-white"
                      : isFocused
                        ? "bg-blue-600 ring-1 ring-white/80"
                        : "bg-red-600"
                  }`}
                >
                  {item.number}
                </div>
              ))}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function SearchPreviewMarker({
  preview,
}: {
  preview: RestaurantSearchResult | null;
}) {
  if (!preview) return null;

  return (
    <AdvancedMarker
      position={{ lat: preview.latitude, lng: preview.longitude }}
      title={preview.name}
      zIndex={2000}
    >
      <div className="flex flex-col items-center">
        <div className="max-w-[10rem] truncate rounded-full bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg ring-2 ring-white">
          {preview.name}
        </div>
        <div className="h-0 w-0 border-x-8 border-t-[10px] border-x-transparent border-t-orange-600" />
      </div>
    </AdvancedMarker>
  );
}

function MapCameraController({
  places,
  focusedPlaceId,
  previewRestaurant,
}: {
  places: Place[];
  focusedPlaceId: string | null;
  previewRestaurant: RestaurantSearchResult | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (previewRestaurant) {
      map.panTo({
        lat: previewRestaurant.latitude,
        lng: previewRestaurant.longitude,
      });
      map.setZoom(16);
      return;
    }

    if (places.length === 0) return;

    if (focusedPlaceId) {
      const place = places.find((p) => p.id === focusedPlaceId);
      if (!place) return;
      map.panTo({ lat: place.latitude, lng: place.longitude });
      map.setZoom(15);
      return;
    }

    if (places.length === 1) {
      map.panTo({ lat: places[0].latitude, lng: places[0].longitude });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    places.forEach((p) =>
      bounds.extend({ lat: p.latitude, lng: p.longitude })
    );
    map.fitBounds(bounds, { top: 80, right: 60, bottom: 60, left: 60 });
  }, [map, places, focusedPlaceId, previewRestaurant]);

  return null;
}

function MapContent({
  places,
  focusedPlaceId,
  routeSegments,
  routesLoading,
  onPlaceClick,
  previewRestaurant,
}: TripMapProps & { previewRestaurant: RestaurantSearchResult | null }) {
  const center = useMemo(() => {
    if (places.length === 0) {
      return { lat: 37.5665, lng: 126.978 };
    }
    const avgLat =
      places.reduce((sum, p) => sum + p.latitude, 0) / places.length;
    const avgLng =
      places.reduce((sum, p) => sum + p.longitude, 0) / places.length;
    return { lat: avgLat, lng: avgLng };
  }, [places]);

  const zoom = places.length <= 1 ? 13 : 12;

  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={center}
      defaultZoom={zoom}
      gestureHandling="greedy"
      disableDefaultUI={false}
      className="h-full w-full"
    >
      <MapCameraController
        places={places}
        focusedPlaceId={focusedPlaceId}
        previewRestaurant={previewRestaurant}
      />
      <SegmentPolylines segments={routeSegments} />
      <PlaceMarkers
        places={places}
        focusedPlaceId={focusedPlaceId}
        onPlaceClick={onPlaceClick}
      />
      <SearchPreviewMarker preview={previewRestaurant} />

      {routesLoading && (
        <div className="absolute left-3 top-3 z-10">
          <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] text-zinc-500 shadow">
            경로 계산 중...
          </span>
        </div>
      )}
    </Map>
  );
}

export function TripMap({
  places,
  focusedPlaceId,
  routeSegments,
  routesLoading,
  onPlaceClick,
  onAddPlace,
}: TripMapProps) {
  const [previewRestaurant, setPreviewRestaurant] =
    useState<RestaurantSearchResult | null>(null);

  if (!isMapsConfigured()) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 p-8">
        <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <MapsSetupGuide />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContent
        places={places}
        focusedPlaceId={focusedPlaceId}
        routeSegments={routeSegments}
        routesLoading={routesLoading}
        onPlaceClick={onPlaceClick}
        previewRestaurant={previewRestaurant}
      />
      {onAddPlace && (
        <MapRestaurantSearch
          places={places}
          onAdd={onAddPlace}
          previewRestaurant={previewRestaurant}
          onPreviewRestaurant={setPreviewRestaurant}
        />
      )}
    </div>
  );
}
