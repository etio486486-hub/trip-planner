export type RawPopularPlaceRow = {
  name: string;
  google_place_id: string | null;
  latitude: number;
  longitude: number;
  memo: string | null;
  daily_plans: { trip_id: string } | { trip_id: string }[];
};

export type PopularPlace = {
  rank: number;
  name: string;
  googlePlaceId: string | null;
  latitude: number;
  longitude: number;
  tripCount: number;
  visitCount: number;
  sampleMemo: string | null;
};

type PlaceAccumulator = {
  name: string;
  googlePlaceId: string | null;
  latitude: number;
  longitude: number;
  tripIds: Set<string>;
  visitCount: number;
  sampleMemo: string | null;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

function placeGroupKey(row: RawPopularPlaceRow): string {
  if (row.google_place_id) {
    return `gp:${row.google_place_id}`;
  }
  const lat = Math.round(row.latitude * 1000) / 1000;
  const lng = Math.round(row.longitude * 1000) / 1000;
  return `loc:${normalizeName(row.name)}:${lat}:${lng}`;
}

function getTripId(row: RawPopularPlaceRow): string | null {
  const plan = row.daily_plans;
  if (Array.isArray(plan)) {
    return plan[0]?.trip_id ?? null;
  }
  return plan?.trip_id ?? null;
}

export function aggregatePopularPlaces(
  rows: RawPopularPlaceRow[],
  limit = 10
): PopularPlace[] {
  const groups = new Map<string, PlaceAccumulator>();

  for (const row of rows) {
    const tripId = getTripId(row);
    if (!tripId || !row.name?.trim()) continue;

    const key = placeGroupKey(row);
    const existing = groups.get(key);

    if (existing) {
      existing.tripIds.add(tripId);
      existing.visitCount += 1;
      if (!existing.sampleMemo && row.memo?.trim()) {
        existing.sampleMemo = row.memo.trim();
      }
      if (row.google_place_id && !existing.googlePlaceId) {
        existing.googlePlaceId = row.google_place_id;
      }
    } else {
      groups.set(key, {
        name: row.name.trim(),
        googlePlaceId: row.google_place_id,
        latitude: row.latitude,
        longitude: row.longitude,
        tripIds: new Set([tripId]),
        visitCount: 1,
        sampleMemo: row.memo?.trim() || null,
      });
    }
  }

  return [...groups.values()]
    .sort((a, b) => {
      if (b.tripIds.size !== a.tripIds.size) {
        return b.tripIds.size - a.tripIds.size;
      }
      return b.visitCount - a.visitCount;
    })
    .slice(0, limit)
    .map((group, index) => ({
      rank: index + 1,
      name: group.name,
      googlePlaceId: group.googlePlaceId,
      latitude: group.latitude,
      longitude: group.longitude,
      tripCount: group.tripIds.size,
      visitCount: group.visitCount,
      sampleMemo: group.sampleMemo,
    }));
}

export function buildGoogleMapsUrl(place: Pick<PopularPlace, "name" | "latitude" | "longitude" | "googlePlaceId">): string {
  if (place.googlePlaceId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.googlePlaceId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`;
}
