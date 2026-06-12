type LatLng = { lat: number; lng: number };

type TravelMode = "DRIVE" | "TRANSIT" | "WALK";

type RouteData = {
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  localizedValues?: {
    distance?: { text?: string };
    duration?: { text?: string };
    staticDuration?: { text?: string };
  };
};

type RouteResponse = {
  routes?: RouteData[];
};

export type RouteInfo = {
  distance: string | null;
  duration: string | null;
};

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

function isValidCoord({ lat, lng }: LatLng): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function parseDurationSeconds(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/^(\d+)s$/);
  return match ? Number(match[1]) : null;
}

function formatDurationKo(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

function formatDistanceKo(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

function extractRouteInfo(route: RouteData | undefined): RouteInfo {
  const localized = route?.localizedValues;
  const durationText =
    localized?.duration?.text ??
    localized?.staticDuration?.text ??
    (() => {
      const sec =
        parseDurationSeconds(route?.duration) ??
        parseDurationSeconds(route?.staticDuration);
      return sec != null ? formatDurationKo(sec) : null;
    })();

  const distanceText =
    localized?.distance?.text ??
    (route?.distanceMeters != null
      ? formatDistanceKo(route.distanceMeters)
      : null);

  return { distance: distanceText, duration: durationText };
}

async function requestRoute(
  body: Record<string, unknown>
): Promise<RouteResponse | null> {
  const apiKey = getApiKey();
  if (!apiKey.startsWith("AIza")) return null;

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.staticDuration,routes.distanceMeters,routes.localizedValues",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    if (
      errText.includes("LegacyApiNotActivated") ||
      errText.includes("SERVICE_DISABLED")
    ) {
      throw new Error("ROUTES_API_DISABLED");
    }
    return null;
  }

  return (await response.json()) as RouteResponse;
}

function buildBaseBody(
  origin: LatLng,
  destination: LatLng,
  travelMode: TravelMode
): Record<string, unknown> {
  return {
    origin: {
      location: {
        latLng: { latitude: origin.lat, longitude: origin.lng },
      },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng },
      },
    },
    travelMode,
    languageCode: "ko",
    units: "METRIC",
  };
}

async function computeDriveRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteInfo | null> {
  const response = await requestRoute({
    ...buildBaseBody(origin, destination, "DRIVE"),
    routingPreference: "TRAFFIC_UNAWARE",
  });

  return extractRouteInfo(response?.routes?.[0]);
}

async function computeTransitRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteInfo | null> {
  const response = await requestRoute({
    ...buildBaseBody(origin, destination, "TRANSIT"),
    departureTime: new Date().toISOString(),
  });

  return extractRouteInfo(response?.routes?.[0]);
}

async function computeWalkRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteInfo | null> {
  const response = await requestRoute({
    ...buildBaseBody(origin, destination, "WALK"),
  });

  return extractRouteInfo(response?.routes?.[0]);
}

export async function computeRoute(
  origin: LatLng,
  destination: LatLng,
  travelMode: TravelMode
): Promise<RouteInfo | null> {
  if (!isValidCoord(origin) || !isValidCoord(destination)) {
    return null;
  }

  switch (travelMode) {
    case "DRIVE":
      return computeDriveRoute(origin, destination);
    case "TRANSIT":
      return computeTransitRoute(origin, destination);
    case "WALK":
      return computeWalkRoute(origin, destination);
    default:
      return null;
  }
}
