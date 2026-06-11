type LatLng = { lat: number; lng: number };

type TravelMode = "DRIVE" | "TRANSIT" | "WALK";

type RouteData = {
  distanceMeters?: number;
  duration?: string;
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
      const sec = parseDurationSeconds(route?.duration);
      return sec != null ? formatDurationKo(sec) : null;
    })();

  const distanceText =
    localized?.distance?.text ??
    (route?.distanceMeters != null
      ? formatDistanceKo(route.distanceMeters)
      : null);

  return { distance: distanceText, duration: durationText };
}

export async function computeRoute(
  origin: LatLng,
  destination: LatLng,
  travelMode: TravelMode
): Promise<RouteInfo | null> {
  const apiKey = getApiKey();
  if (!apiKey.startsWith("AIza")) return null;

  const body: Record<string, unknown> = {
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

  if (travelMode === "DRIVE") {
    body.routingPreference = "TRAFFIC_AWARE";
    body.departureTime = new Date().toISOString();
  }

  if (travelMode === "TRANSIT") {
    body.departureTime = new Date().toISOString();
  }

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.localizedValues",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    if (
      errText.includes("LegacyApiNotActivated") ||
      errText.includes("SERVICE_DISABLED") ||
      errText.includes("Routes API")
    ) {
      throw new Error("ROUTES_API_DISABLED");
    }
    throw new Error(`ROUTES_API_ERROR:${response.status}`);
  }

  const data = (await response.json()) as RouteResponse;
  const route = data.routes?.[0];
  if (!route) return null;

  return extractRouteInfo(route);
}
