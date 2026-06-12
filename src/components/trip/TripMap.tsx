"use client";

import { useEffect, useMemo } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import type { MapRouteSegment } from "@/hooks/useTripRouteLegs";
import type { RouteViewMode } from "@/lib/maps/segment-colors";
import { isMapsConfigured } from "./MapsProvider";
import { MapsSetupGuide } from "./MapsSetupGuide";
import { RouteModeSelector } from "./RouteModeSelector";
import type { Place } from "@/types/database";

const MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim() || "DEMO_MAP_ID";

type TripMapProps = {
  places: Place[];
  focusedPlaceId: string | null;
  routeSegments: MapRouteSegment[];
  routeViewMode: RouteViewMode;
  onRouteViewModeChange: (mode: RouteViewMode) => void;
  routesLoading?: boolean;
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
}: {
  places: Place[];
  focusedPlaceId: string | null;
}) {
  return (
    <>
      {places.map((place, index) => {
        const isFocused = place.id === focusedPlaceId;
        return (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.latitude, lng: place.longitude }}
            title={place.name}
            zIndex={isFocused ? 1000 : index}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ${
                isFocused ? "bg-blue-700 ring-2 ring-white" : "bg-red-600"
              }`}
            >
              {index + 1}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function MapCameraController({
  places,
  focusedPlaceId,
}: {
  places: Place[];
  focusedPlaceId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || places.length === 0) return;

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
  }, [map, places, focusedPlaceId]);

  return null;
}

function MapContent({
  places,
  focusedPlaceId,
  routeSegments,
  routeViewMode,
  onRouteViewModeChange,
  routesLoading,
}: TripMapProps) {
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
      <MapCameraController places={places} focusedPlaceId={focusedPlaceId} />
      <SegmentPolylines segments={routeSegments} />
      <PlaceMarkers places={places} focusedPlaceId={focusedPlaceId} />

      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <RouteModeSelector
          mode={routeViewMode}
          onChange={onRouteViewModeChange}
        />
        {routesLoading && (
          <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] text-zinc-500 shadow">
            경로 계산 중...
          </span>
        )}
      </div>
    </Map>
  );
}

export function TripMap({
  places,
  focusedPlaceId,
  routeSegments,
  routeViewMode,
  onRouteViewModeChange,
  routesLoading,
}: TripMapProps) {
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
        routeViewMode={routeViewMode}
        onRouteViewModeChange={onRouteViewModeChange}
        routesLoading={routesLoading}
      />
    </div>
  );
}
