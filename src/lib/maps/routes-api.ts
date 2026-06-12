import { buildTaxiPhraseWithReading } from "@/lib/japanese-reading";
import { decodePolyline, type LatLng } from "./polyline";

type TravelMode = "DRIVE" | "TRANSIT" | "WALK";

type LocalizedText = { text?: string };

type Money = {
  currencyCode?: string;
  units?: string;
  nanos?: number;
};

type TransitStop = {
  name?: string;
  location?: { latLng?: { latitude?: number; longitude?: number } };
};

type RouteStep = {
  travelMode?: string;
  staticDuration?: string;
  polyline?: { encodedPolyline?: string };
  transitDetails?: {
    headsign?: string;
    transitLine?: {
      name?: string;
      nameShort?: string;
      vehicle?: { type?: string; name?: { text?: string } };
    };
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
  polyline?: { encodedPolyline?: string };
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
  path: LatLng[];
};

export type TransitStepInfo = {
  lineName: string;
  lineShort: string | null;
  vehicleType: string | null;
  boardStop: string | null;
  alightStop: string | null;
  headsign: string | null;
  duration: string | null;
};

export type TransitDetails = {
  duration: string | null;
  fareText: string | null;
  fareYen: number | null;
  boardStop: string | null;
  alightStop: string | null;
  lineName: string | null;
  headsign: string | null;
  steps: TransitStepInfo[];
  path: LatLng[];
};

export type RouteLegDetails = {
  distance: string | null;
  distanceMeters: number | null;
  paths: {
    walk: LatLng[];
    drive: LatLng[];
    transit: LatLng[];
  };
  taxi: {
    duration: string | null;
    fareYen: number | null;
    phraseJa: string;
    phraseKo: string;
    phraseReadingKo: string;
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
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${meters}m`;
}

function parseMoney(m?: Money): number | null {
  if (!m?.units) return null;
  const units = Number(m.units);
  if (!Number.isFinite(units)) return null;
  return Math.round(units + (m.nanos ?? 0) / 1e9);
}

function formatFareText(yen: number | null, text?: string | null): string | null {
  if (text) return text;
  if (yen == null) return null;
  return `약 ¥${yen.toLocaleString("ja-JP")}`;
}

const VEHICLE_LABELS: Record<string, string> = {
  SUBWAY: "지하철",
  METRO: "지하철",
  TRAIN: "전철",
  TRAM: "트램",
  BUS: "버스",
  FERRY: "페리",
  RAIL: "철도",
};

export function estimateJapanTaxiFare(meters: number): number {
  const initialDistance = 1674;
  const initialFare = 620;
  const unitDistance = 226;
  const unitFare = 100;
  if (meters <= initialDistance) return initialFare;
  const units = Math.ceil((meters - initialDistance) / unitDistance);
  return initialFare + units * unitFare;
}

export function buildTaxiPhrases(destinationName: string): {
  phraseJa: string;
  phraseKo: string;
  phraseReadingKo: string;
} {
  return buildTaxiPhraseWithReading(destinationName);
}

function extractPathFromRoute(route?: RouteData): LatLng[] {
  if (!route) return [];

  const main = route.polyline?.encodedPolyline;
  if (main) return decodePolyline(main);

  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  return steps.flatMap((step) =>
    step.polyline?.encodedPolyline
      ? decodePolyline(step.polyline.encodedPolyline)
      : []
  );
}

function extractTransitOnlyPath(route?: RouteData): LatLng[] {
  if (!route) return [];

  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const transitPoints: LatLng[] = [];

  for (const step of steps) {
    if (step.travelMode !== "TRANSIT" || !step.transitDetails) continue;

    if (step.polyline?.encodedPolyline) {
      transitPoints.push(...decodePolyline(step.polyline.encodedPolyline));
      continue;
    }

    const dep = step.transitDetails.stopDetails?.departureStop?.location?.latLng;
    const arr = step.transitDetails.stopDetails?.arrivalStop?.location?.latLng;
    if (dep?.latitude != null && dep?.longitude != null) {
      transitPoints.push({ lat: dep.latitude, lng: dep.longitude });
    }
    if (arr?.latitude != null && arr?.longitude != null) {
      transitPoints.push({ lat: arr.latitude, lng: arr.longitude });
    }
  }

  return transitPoints;
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
    path: extractPathFromRoute(route),
  };
}

function parseTransitStep(step: RouteStep): TransitStepInfo | null {
  if (step.travelMode !== "TRANSIT" || !step.transitDetails) return null;

  const td = step.transitDetails;
  const line = td.transitLine;
  const vehicleType = line?.vehicle?.type ?? null;

  const sec = parseDurationSeconds(step.staticDuration);

  return {
    lineName: line?.name ?? line?.nameShort ?? "대중교통",
    lineShort: line?.nameShort ?? null,
    vehicleType: vehicleType
      ? (VEHICLE_LABELS[vehicleType] ?? vehicleType)
      : null,
    boardStop: td.stopDetails?.departureStop?.name ?? null,
    alightStop: td.stopDetails?.arrivalStop?.name ?? null,
    headsign: td.headsign ?? null,
    duration: sec != null ? formatDurationKo(sec) : null,
  };
}

function extractTransitDetails(route: RouteData | undefined): TransitDetails | null {
  if (!route) return null;

  const base = extractRouteInfo(route);
  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const transitSteps = steps
    .map(parseTransitStep)
    .filter((s): s is TransitStepInfo => s !== null);

  if (transitSteps.length === 0 && !base.duration) return null;

  const first = transitSteps[0];
  const last = transitSteps[transitSteps.length - 1];

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
    ...new Set(transitSteps.map((s) => s.lineShort ?? s.lineName)),
  ];

  return {
    duration: base.duration,
    fareText,
    fareYen,
    boardStop: first?.boardStop ?? null,
    alightStop: last?.alightStop ?? null,
    lineName: lineNames.join(" → ") || null,
    headsign: first?.headsign ?? null,
    steps: transitSteps,
    path: extractTransitOnlyPath(route),
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
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng },
      },
    },
    travelMode,
    languageCode: "ko",
    units: "METRIC",
    polylineQuality: "HIGH_QUALITY",
    polylineEncoding: "ENCODED_POLYLINE",
  };
}

const ROUTE_MASK = [
  "routes.duration",
  "routes.staticDuration",
  "routes.distanceMeters",
  "routes.localizedValues",
  "routes.polyline.encodedPolyline",
  "routes.legs.steps.travelMode",
  "routes.legs.steps.staticDuration",
  "routes.legs.steps.polyline.encodedPolyline",
].join(",");

const TRANSIT_MASK = [
  ROUTE_MASK,
  "routes.legs.steps.transitDetails",
  "routes.legs.steps.transitDetails.stopDetails",
  "routes.legs.steps.transitDetails.stopDetails.departureStop.location",
  "routes.legs.steps.transitDetails.stopDetails.arrivalStop.location",
  "routes.legs.steps.transitDetails.transitLine",
  "routes.legs.steps.transitDetails.transitLine.vehicle",
  "routes.travelAdvisory.transitFare",
  "routes.localizedValues.transitFare",
].join(",");

export async function computeRoute(
  origin: LatLng,
  destination: LatLng,
  travelMode: TravelMode
): Promise<RouteInfo | null> {
  if (!isValidCoord(origin) || !isValidCoord(destination)) return null;

  const body: Record<string, unknown> = {
    ...buildBaseBody(origin, destination, travelMode),
  };

  if (travelMode === "DRIVE") body.routingPreference = "TRAFFIC_UNAWARE";
  if (travelMode === "TRANSIT") {
    body.departureTime = new Date().toISOString();
  }

  const mask = travelMode === "TRANSIT" ? TRANSIT_MASK : ROUTE_MASK;
  const response = await requestRoute(body, mask);
  return extractRouteInfo(response?.routes?.[0]);
}

export async function computeRouteLegDetails(
  origin: LatLng,
  destination: LatLng,
  destinationName: string
): Promise<RouteLegDetails | null> {
  if (!isValidCoord(origin) || !isValidCoord(destination)) return null;

  const phrases = buildTaxiPhrases(destinationName);

  const [driveRes, walkRes, transitRes] = await Promise.all([
    requestRoute(
      {
        ...buildBaseBody(origin, destination, "DRIVE"),
        routingPreference: "TRAFFIC_UNAWARE",
      },
      ROUTE_MASK
    ),
    requestRoute(buildBaseBody(origin, destination, "WALK"), ROUTE_MASK),
    requestRoute(
      {
        ...buildBaseBody(origin, destination, "TRANSIT"),
        departureTime: new Date().toISOString(),
      },
      TRANSIT_MASK
    ),
  ]);

  const driveRoute = driveRes?.routes?.[0];
  const walkRoute = walkRes?.routes?.[0];
  const transitRoute = transitRes?.routes?.[0];

  const drive = extractRouteInfo(driveRoute);
  const walk = extractRouteInfo(walkRoute);
  const transit = extractTransitDetails(transitRoute);

  const distanceMeters =
    drive.distanceMeters ??
    walk.distanceMeters ??
    transitRoute?.distanceMeters ??
    null;

  return {
    distance:
      drive.distance ??
      walk.distance ??
      (distanceMeters != null ? formatDistanceKo(distanceMeters) : null),
    distanceMeters,
    paths: {
      walk: walk.path,
      drive: drive.path,
      transit:
        transit && transit.path.length > 0
          ? transit.path
          : extractPathFromRoute(transitRoute),
    },
    taxi: {
      duration: drive.duration,
      fareYen:
        distanceMeters != null ? estimateJapanTaxiFare(distanceMeters) : null,
      phraseJa: phrases.phraseJa,
      phraseKo: phrases.phraseKo,
      phraseReadingKo: phrases.phraseReadingKo,
    },
    transit,
    walking: walk.duration,
  };
}
