type LatLng = { lat: number; lng: number };

type TravelMode = "DRIVE" | "TRANSIT" | "WALK";

type LocalizedText = { text?: string };

type Money = {
  currencyCode?: string;
  units?: string;
  nanos?: number;
};

type TransitStop = { name?: string };

type RouteStep = {
  travelMode?: string;
  transitDetails?: {
    headsign?: string;
    transitLine?: { name?: string; nameShort?: string };
    stopDetails?: {
      departureStop?: TransitStop;
      arrivalStop?: TransitStop;
    };
    localizedValues?: {
      transitFare?: LocalizedText;
    };
  };
};

type RouteLeg = {
  steps?: RouteStep[];
};

type RouteData = {
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  legs?: RouteLeg[];
  travelAdvisory?: {
    transitFare?: Money | LocalizedText;
  };
  localizedValues?: {
    distance?: LocalizedText;
    duration?: LocalizedText;
    staticDuration?: LocalizedText;
    transitFare?: LocalizedText;
  };
};

type RouteResponse = {
  routes?: RouteData[];
};

export type RouteInfo = {
  distance: string | null;
  duration: string | null;
  distanceMeters: number | null;
};

export type TransitDetails = {
  duration: string | null;
  fareText: string | null;
  fareYen: number | null;
  boardStop: string | null;
  alightStop: string | null;
  lineName: string | null;
  headsign: string | null;
};

export type RouteLegDetails = {
  distance: string | null;
  distanceMeters: number | null;
  taxi: {
    duration: string | null;
    fareYen: number | null;
    phraseJa: string;
    phraseKo: string;
  };
  transit: TransitDetails | null;
  walking: string | null;
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

function parseMoney(m?: Money): number | null {
  if (!m?.units) return null;
  const units = Number(m.units);
  if (!Number.isFinite(units)) return null;
  const nanos = m.nanos ?? 0;
  return Math.round(units + nanos / 1e9);
}

function formatFareText(yen: number | null, text?: string | null): string | null {
  if (text) return text;
  if (yen == null) return null;
  return `약 ¥${yen.toLocaleString("ja-JP")}`;
}

/** 후쿠오카·일본 일반 택시 요금 추정 */
export function estimateJapanTaxiFare(meters: number): number {
  const initialDistance = 1674;
  const initialFare = 620;
  const unitDistance = 226;
  const unitFare = 100;
  if (meters <= initialDistance) return initialFare;
  const extra = meters - initialDistance;
  const units = Math.ceil(extra / unitDistance);
  return initialFare + units * unitFare;
}

export function buildTaxiPhrases(destinationName: string): {
  phraseJa: string;
  phraseKo: string;
} {
  const name = destinationName.trim() || "目的地";
  return {
    phraseJa: `「${name}までお願いします」`,
    phraseKo: `택시 기사님께: "${name}까지 가주세요" (일본어로는 위 문장을 보여주세요)`,
  };
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

  return {
    distance: distanceText,
    duration: durationText,
    distanceMeters: route?.distanceMeters ?? null,
  };
}

function extractTransitDetails(route: RouteData | undefined): TransitDetails | null {
  if (!route) return null;

  const base = extractRouteInfo(route);
  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const transitSteps = steps.filter(
    (s) => s.travelMode === "TRANSIT" && s.transitDetails
  );

  if (transitSteps.length === 0 && !base.duration) return null;

  const first = transitSteps[0]?.transitDetails;
  const last = transitSteps[transitSteps.length - 1]?.transitDetails;

  const boardStop =
    first?.stopDetails?.departureStop?.name ??
    first?.stopDetails?.arrivalStop?.name ??
    null;
  const alightStop =
    last?.stopDetails?.arrivalStop?.name ??
    last?.stopDetails?.departureStop?.name ??
    null;

  const advisoryFare = route.travelAdvisory?.transitFare;
  let fareYen: number | null = null;
  let fareText: string | null = null;

  if (advisoryFare && "text" in advisoryFare && advisoryFare.text) {
    fareText = advisoryFare.text;
  } else if (advisoryFare && "units" in advisoryFare) {
    fareYen = parseMoney(advisoryFare as Money);
    fareText = formatFareText(fareYen, null);
  }

  if (!fareText) {
    fareText = route.localizedValues?.transitFare?.text ?? null;
  }

  if (!fareYen && fareText) {
    const match = fareText.replace(/,/g, "").match(/(\d+)/);
    if (match) fareYen = Number(match[1]);
  }

  const lineNames = [
    ...new Set(
      transitSteps
        .map(
          (s) =>
            s.transitDetails?.transitLine?.nameShort ??
            s.transitDetails?.transitLine?.name
        )
        .filter(Boolean)
    ),
  ];

  return {
    duration: base.duration,
    fareText,
    fareYen,
    boardStop,
    alightStop,
    lineName: lineNames.join(" → ") || null,
    headsign: first?.headsign ?? null,
  };
}

async function requestRoute(
  body: Record<string, unknown>,
  fieldMask: string
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
        "X-Goog-FieldMask": fieldMask,
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

const BASIC_MASK =
  "routes.duration,routes.staticDuration,routes.distanceMeters,routes.localizedValues";

const TRANSIT_MASK = [
  BASIC_MASK,
  "routes.legs.steps.travelMode",
  "routes.legs.steps.transitDetails",
  "routes.legs.steps.transitDetails.stopDetails",
  "routes.legs.steps.transitDetails.transitLine",
  "routes.travelAdvisory.transitFare",
  "routes.localizedValues.transitFare",
].join(",");

export async function computeRoute(
  origin: LatLng,
  destination: LatLng,
  travelMode: TravelMode
): Promise<RouteInfo | null> {
  if (!isValidCoord(origin) || !isValidCoord(destination)) {
    return null;
  }

  const body: Record<string, unknown> = {
    ...buildBaseBody(origin, destination, travelMode),
  };

  if (travelMode === "DRIVE") {
    body.routingPreference = "TRAFFIC_UNAWARE";
  }
  if (travelMode === "TRANSIT") {
    body.departureTime = new Date().toISOString();
  }

  const mask = travelMode === "TRANSIT" ? TRANSIT_MASK : BASIC_MASK;
  const response = await requestRoute(body, mask);
  return extractRouteInfo(response?.routes?.[0]);
}

export async function computeRouteLegDetails(
  origin: LatLng,
  destination: LatLng,
  destinationName: string
): Promise<RouteLegDetails | null> {
  if (!isValidCoord(origin) || !isValidCoord(destination)) {
    return null;
  }

  const phrases = buildTaxiPhrases(destinationName);

  const [driveRes, walkRes, transitRes] = await Promise.all([
    requestRoute(
      {
        ...buildBaseBody(origin, destination, "DRIVE"),
        routingPreference: "TRAFFIC_UNAWARE",
      },
      BASIC_MASK
    ),
    requestRoute(buildBaseBody(origin, destination, "WALK"), BASIC_MASK),
    requestRoute(
      {
        ...buildBaseBody(origin, destination, "TRANSIT"),
        departureTime: new Date().toISOString(),
      },
      TRANSIT_MASK
    ),
  ]);

  const drive = extractRouteInfo(driveRes?.routes?.[0]);
  const walk = extractRouteInfo(walkRes?.routes?.[0]);
  const transit = extractTransitDetails(transitRes?.routes?.[0]);

  const distanceMeters =
    drive.distanceMeters ?? walk.distanceMeters ?? transitRes?.routes?.[0]?.distanceMeters ?? null;

  const taxiFareYen =
    distanceMeters != null ? estimateJapanTaxiFare(distanceMeters) : null;

  return {
    distance:
      drive.distance ?? walk.distance ?? (distanceMeters != null ? formatDistanceKo(distanceMeters) : null),
    distanceMeters,
    taxi: {
      duration: drive.duration,
      fareYen: taxiFareYen,
      phraseJa: phrases.phraseJa,
      phraseKo: phrases.phraseKo,
    },
    transit,
    walking: walk.duration,
  };
}
