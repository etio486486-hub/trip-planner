import { searchPlaceByText } from "@/lib/maps/places-api";
import type { PlaceInput } from "@/types/database";

export type AiPlaceInput = {
  dayNumber: number;
  name: string;
  memo?: string;
};

export type ResolveAiPlacesResult = {
  resolved: Array<{ dayNumber: number; place: PlaceInput }>;
  skipped: string[];
};

/** AI 추천 장소명 → Google Places 좌표 해상도 */
export async function resolveAiPlaces(
  items: AiPlaceInput[],
  destination: string,
  biasLat: number,
  biasLng: number
): Promise<ResolveAiPlacesResult> {
  const resolved: Array<{ dayNumber: number; place: PlaceInput }> = [];
  const skipped: string[] = [];
  const usedCoords = new Set<string>();

  for (const item of items) {
    const found = await searchPlaceByText({
      query: item.name,
      destination,
      latitude: biasLat,
      longitude: biasLng,
    });

    if (!found) {
      skipped.push(item.name);
      continue;
    }

    const coordKey = `${found.latitude.toFixed(5)},${found.longitude.toFixed(5)}`;
    if (usedCoords.has(coordKey)) {
      skipped.push(`${item.name} (중복 위치)`);
      continue;
    }
    usedCoords.add(coordKey);

    resolved.push({
      dayNumber: item.dayNumber,
      place: {
        name: found.name,
        google_place_id: found.placeId,
        latitude: found.latitude,
        longitude: found.longitude,
        memo: item.memo
          ? `[AI ${item.dayNumber}일차] ${item.memo}`
          : `[AI ${item.dayNumber}일차]`,
      },
    });

    // Places API rate limit 완화
    await new Promise((r) => setTimeout(r, 120));
  }

  return { resolved, skipped };
}
