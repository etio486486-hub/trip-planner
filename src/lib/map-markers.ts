import type { Place } from "@/types/database";

export type PlaceMarkerItem = {
  place: Place;
  /** 1-based 일정 번호 */
  number: number;
};

export type PlaceMarkerGroup = {
  lat: number;
  lng: number;
  items: PlaceMarkerItem[];
};

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 가까운 장소를 하나의 마커로 묶음 (예: 3번·5번 같은 건물) */
export function groupPlacesForMarkers(
  places: Place[],
  thresholdMeters = 50
): PlaceMarkerGroup[] {
  const groups: PlaceMarkerGroup[] = [];

  places.forEach((place, index) => {
    const number = index + 1;
    const existing = groups.find(
      (g) =>
        haversineMeters(
          place.latitude,
          place.longitude,
          g.lat,
          g.lng
        ) < thresholdMeters
    );

    if (existing) {
      existing.items.push({ place, number });
    } else {
      groups.push({
        lat: place.latitude,
        lng: place.longitude,
        items: [{ place, number }],
      });
    }
  });

  return groups;
}
