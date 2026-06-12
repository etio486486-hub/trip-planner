export const SEGMENT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#db2777",
  "#0891b2",
  "#ca8a04",
] as const;

export function getSegmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

export type RouteViewMode = "WALK" | "DRIVE" | "TRANSIT";

export const ROUTE_MODE_LABELS: Record<RouteViewMode, string> = {
  WALK: "도보",
  DRIVE: "택시",
  TRANSIT: "지하철",
};
