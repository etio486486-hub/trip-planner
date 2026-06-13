import type { AiDay } from "@/components/pro/AiRecommendPanel";
import { resolveAiPlaces } from "@/lib/ai-place-resolve";
import type { Place, PlaceInput, Trip } from "@/types/database";

export function getDayDate(startDate: string, dayNumber: number): string {
  const d = new Date(`${startDate}T12:00:00`);
  d.setDate(d.getDate() + dayNumber - 1);
  return d.toISOString().slice(0, 10);
}

export function computeMapCenter(places: Place[]): { lat: number; lng: number } {
  if (places.length === 0) {
    return { lat: 33.5904, lng: 130.4017 };
  }
  return {
    lat: places.reduce((s, p) => s + p.latitude, 0) / places.length,
    lng: places.reduce((s, p) => s + p.longitude, 0) / places.length,
  };
}

export function getDestinationLabel(trip: Trip | null): string {
  return (
    trip?.title?.replace(/\s*여행!?\s*$/u, "").trim() || trip?.title || "여행지"
  );
}

export async function addAiCourseToTrip(
  days: AiDay[],
  ctx: {
    destination: string;
    defaultLat: number;
    defaultLng: number;
    maxDayNumber?: number;
  },
  onEnsureDaysUpTo: (dayNumber: number) => Promise<void>,
  onAddPlaceToDay: (dayNumber: number, place: PlaceInput) => Promise<void>
): Promise<{ added: number; skipped: string[] }> {
  const filteredDays = ctx.maxDayNumber
    ? days.filter((d) => d.dayNumber <= ctx.maxDayNumber!)
    : days;

  if (filteredDays.length === 0) {
    return { added: 0, skipped: [] };
  }

  const maxDay = Math.max(...filteredDays.map((d) => d.dayNumber), 1);
  await onEnsureDaysUpTo(maxDay);

  const items = filteredDays.flatMap((day) =>
    day.places.map((p) => ({
      dayNumber: day.dayNumber,
      name: p.name,
      memo: p.memo,
    }))
  );

  const { resolved, skipped } = await resolveAiPlaces(
    items,
    ctx.destination,
    ctx.defaultLat,
    ctx.defaultLng
  );

  for (const { dayNumber, place } of resolved) {
    await onAddPlaceToDay(dayNumber, place);
  }

  return { added: resolved.length, skipped };
}
