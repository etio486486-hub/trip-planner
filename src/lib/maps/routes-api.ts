import { buildTaxiPhraseWithReading } from "@/lib/japanese-reading";
import {
  findTransitStopsNear,
  type TransitStopInfo,
} from "@/lib/maps/places-api";
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

export type TransitWalkSegment = {
  type: "WALK";
  label: string;
  duration: string | null;
};

export type TransitRideSegment = TransitStepInfo & {
  type: "TRANSIT";
};

export type TransitSegment = TransitWalkSegment | TransitRideSegment;

export type TransitDetails = {
  duration: string | null;
  fareText: string | null;
  fareYen: number | null;
  boardStop: string | null;
  alightStop: string | null;
  lineName: string | null;
  headsign: string | null;
  steps: TransitStepInfo[];
  segments: TransitSegment[];
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

function sumDurationSeconds(parts: (string | null | undefined)[]): string | null {
  let total = 0;
  let found = false;
  for (const part of parts) {
    const sec = parseDurationSeconds(part ?? undefined);
    if (sec != null) {
      total += sec;
      found = true;
    }
  }
  return found ? formatDurationKo(total) : null;
}

function parseRouteStepsIntoSegments(steps: RouteStep[]): TransitSegment[] {
  const segments: TransitSegment[] = [];
  const firstTransitIdx = steps.findIndex((s) => s.travelMode === "TRANSIT");
  const lastTransitIdx = steps.findLastIndex((s) => s.travelMode === "TRANSIT");

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (step.travelMode === "WALK") {
      const sec = parseDurationSeconds(step.staticDuration);
      let label = "도보 이동";

      if (firstTransitIdx >= 0 && i < firstTransitIdx) {
        const board =
          steps[firstTransitIdx].transitDetails?.stopDetails?.departureStop
            ?.name;
        label = board ? `출발지 → ${board} 도보` : "출발지 → 승차역 도보";
      } else if (lastTransitIdx >= 0 && i > lastTransitIdx) {
        const alight =
          steps[lastTransitIdx].transitDetails?.stopDetails?.arrivalStop?.name;
        label = alight ? `${alight} → 도착지 도보` : "하차역 → 도착지 도보";
      } else if (
        firstTransitIdx >= 0 &&
        lastTransitIdx >= 0 &&
        i > firstTransitIdx &&
        i < lastTransitIdx
      ) {
        label = "환승 도보";
      }

      segments.push({
        type: "WALK",
        label,
        duration: sec != null ? formatDurationKo(sec) : null,
      });
      continue;
    }

    if (step.travelMode === "TRANSIT") {
      const parsed = parseTransitStep(step);
      if (parsed) segments.push({ type: "TRANSIT", ...parsed });
    }
  }

  return segments;
}

function transitRideSegments(segments: TransitSegment[]): TransitRideSegment[] {
  return segments.filter((s): s is TransitRideSegment => s.type === "TRANSIT");
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

function extractTransitFare(route: RouteData): {
  fareYen: number | null;
  fareText: string | null;
} {
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

  return { fareYen, fareText };
}

function buildTransitDetailsFromRoute(
  route: RouteData,
  segments: TransitSegment[],
  path: LatLng[],
  durationOverride?: string | null
): TransitDetails {
  const base = extractRouteInfo(route);
  const rides = transitRideSegments(segments);
  const first = rides[0];
  const last = rides[rides.length - 1];
  const { fareYen, fareText } = extractTransitFare(route);
  const lineNames = [...new Set(rides.map((s) => s.lineShort ?? s.lineName))];

  return {
    duration: durationOverride ?? base.duration,
    fareText,
    fareYen,
    boardStop: first?.boardStop ?? null,
    alightStop: last?.alightStop ?? null,
    lineName: lineNames.join(" → ") || null,
    headsign: first?.headsign ?? null,
    steps: rides,
    segments,
    path,
  };
}

function extractTransitDetails(route: RouteData | undefined): TransitDetails | null {
  if (!route) return null;

  const base = extractRouteInfo(route);
  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const segments = parseRouteStepsIntoSegments(steps);
  const rides = transitRideSegments(segments);

  if (rides.length === 0 && !base.duration) return null;

  return buildTransitDetailsFromRoute(
    route,
    segments,
    extractPathFromRoute(route)
  );
}

const TRANSIT_MODE_PREFS = {
  routingPreference: "LESS_WALKING",
  allowedTravelModes: ["SUBWAY", "TRAIN", "LIGHT_RAIL", "RAIL", "BUS"],
};

function buildTransitRequestBody(
  origin: LatLng,
  destination: LatLng,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    ...buildBaseBody(origin, destination, "TRANSIT"),
    departureTime: new Date().toISOString(),
    regionCode: "JP",
    transitPreferences: TRANSIT_MODE_PREFS,
    ...extra,
  };
}

function buildTransitAddressBody(
  originName: string,
  destinationName: string
): Record<string, unknown> {
  return {
    origin: { address: `${originName}, Fukuoka, Japan` },
    destination: { address: `${destinationName}, Fukuoka, Japan` },
    travelMode: "TRANSIT",
    departureTime: new Date().toISOString(),
    languageCode: "ko",
    regionCode: "JP",
    units: "METRIC",
    transitPreferences: TRANSIT_MODE_PREFS,
  };
}

function pickBestTransitRoute(
  routes: RouteData[]
): RouteData | undefined {
  for (const route of routes) {
    const details = extractTransitDetails(route);
    if (details && transitRideSegments(details.segments).length > 0) {
      return route;
    }
  }
  return routes[0];
}

async function requestTransitRoutes(
  origin: LatLng,
  destination: LatLng,
  originName?: string,
  destinationName?: string
): Promise<RouteData[]> {
  const bodies: Record<string, unknown>[] = [
    buildTransitRequestBody(origin, destination),
    {
      ...buildBaseBody(origin, destination, "TRANSIT"),
      departureTime: new Date().toISOString(),
      regionCode: "JP",
    },
    buildTransitRequestBody(origin, destination, {
      computeAlternativeRoutes: true,
    }),
  ];

  if (originName && destinationName) {
    bodies.push(buildTransitAddressBody(originName, destinationName));
  }

  const routes: RouteData[] = [];
  for (const body of bodies) {
    const response = await requestRoute(body, TRANSIT_MASK);
    for (const route of response?.routes ?? []) {
      routes.push(route);
    }
  }

  return routes;
}

function isAirportLikeStop(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("空港") ||
    n.includes("airport") ||
    n.includes("공항") ||
    n.includes("kuko")
  );
}

function isTenjinLikeStop(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("天神") || n.includes("tenjin") || n.includes("텐진");
}

function buildKnownFukuokaTransitFallback(
  originStop: TransitStopInfo,
  destStop: TransitStopInfo,
  walkTo: RouteInfo,
  walkFrom: RouteInfo
): TransitDetails | null {
  if (!isAirportLikeStop(originStop.name) || !isTenjinLikeStop(destStop.name)) {
    return null;
  }

  const segments: TransitSegment[] = [
    {
      type: "WALK",
      label: `출발지 → ${originStop.name} 도보`,
      duration: walkTo.duration,
    },
    {
      type: "TRANSIT",
      lineName: "福岡市地下鉄空港線",
      lineShort: "공항선",
      vehicleType: "지하철",
      boardStop: originStop.name,
      alightStop: destStop.name,
      headsign: "텐진 방면",
      duration: "약 11분",
    },
    {
      type: "WALK",
      label: `${destStop.name} → 도착지 도보`,
      duration: walkFrom.duration,
    },
  ];

  const rides = transitRideSegments(segments);
  const path = [...walkTo.path, ...walkFrom.path];

  const durationParts = [
    walkTo.duration,
    "지하철 약 11분",
    walkFrom.duration,
  ].filter(Boolean);

  return {
    duration:
      durationParts.length > 0
        ? durationParts.join(" + ")
        : "약 15분",
    fareText: "약 ¥260 (공항선 기준)",
    fareYen: 260,
    boardStop: originStop.name,
    alightStop: destStop.name,
    lineName: "공항선",
    headsign: "텐진 방면",
    steps: rides,
    segments,
    path,
  };
}

async function tryHybridTransitPair(
  origin: LatLng,
  destination: LatLng,
  originStop: TransitStopInfo,
  destStop: TransitStopInfo
): Promise<TransitDetails | null> {
  const originStation = {
    lat: originStop.latitude,
    lng: originStop.longitude,
  };
  const destStation = {
    lat: destStop.latitude,
    lng: destStop.longitude,
  };

  const [walkToRes, walkFromRes, transitRoutes] = await Promise.all([
    requestRoute(buildBaseBody(origin, originStation, "WALK"), ROUTE_MASK),
    requestRoute(buildBaseBody(destStation, destination, "WALK"), ROUTE_MASK),
    requestTransitRoutes(
      originStation,
      destStation,
      originStop.name,
      destStop.name
    ),
  ]);

  const walkToRoute = walkToRes?.routes?.[0];
  const walkFromRoute = walkFromRes?.routes?.[0];
  const walkTo = extractRouteInfo(walkToRoute);
  const walkFrom = extractRouteInfo(walkFromRoute);
  const transitRoute = pickBestTransitRoute(transitRoutes);
  const coreTransit = extractTransitDetails(transitRoute);
  const coreRides = coreTransit ? transitRideSegments(coreTransit.segments) : [];

  if (coreTransit && coreRides.length > 0) {
    const segments: TransitSegment[] = [
      {
        type: "WALK",
        label: `출발지 → ${originStop.name} 도보`,
        duration: walkTo.duration,
      },
      ...coreTransit.segments,
      {
        type: "WALK",
        label: `${destStop.name} → 도착지 도보`,
        duration: walkFrom.duration,
      },
    ];

    const path = [...walkTo.path, ...coreTransit.path, ...walkFrom.path];
    const totalDuration = sumDurationSeconds([
      walkToRoute?.staticDuration ?? walkToRoute?.duration,
      transitRoute?.staticDuration ?? transitRoute?.duration,
      walkFromRoute?.staticDuration ?? walkFromRoute?.duration,
    ]);

    return buildTransitDetailsFromRoute(
      transitRoute!,
      segments,
      path,
      totalDuration
    );
  }

  return buildKnownFukuokaTransitFallback(
    originStop,
    destStop,
    walkTo,
    walkFrom
  );
}

async function buildHybridTransitFallback(
  origin: LatLng,
  destination: LatLng
): Promise<TransitDetails | null> {
  const [originStops, destStops] = await Promise.all([
    findTransitStopsNear(origin.lat, origin.lng, 3),
    findTransitStopsNear(destination.lat, destination.lng, 3),
  ]);

  if (originStops.length === 0 || destStops.length === 0) return null;

  for (const originStop of originStops) {
    for (const destStop of destStops) {
      const result = await tryHybridTransitPair(
        origin,
        destination,
        originStop,
        destStop
      );
      if (result) return result;
    }
  }

  return null;
}

async function resolveTransitDetails(
  origin: LatLng,
  destination: LatLng,
  transitRoute: RouteData | undefined
): Promise<TransitDetails | null> {
  const directRoutes = transitRoute
    ? [transitRoute]
    : await requestTransitRoutes(origin, destination);

  for (const route of directRoutes) {
    const direct = extractTransitDetails(route);
    if (direct && transitRideSegments(direct.segments).length > 0) {
      return direct;
    }
  }

  const hybrid = await buildHybridTransitFallback(origin, destination);
  if (hybrid) return hybrid;

  return extractTransitDetails(transitRoute);
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
    regionCode: "JP",
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
  "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
  "routes.legs.steps.transitDetails.stopDetails.departureStop.location",
  "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
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
    body.regionCode = "JP";
    body.transitPreferences = TRANSIT_MODE_PREFS;
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

  const [driveRes, walkRes, transitRoutes] = await Promise.all([
    requestRoute(
      {
        ...buildBaseBody(origin, destination, "DRIVE"),
        routingPreference: "TRAFFIC_UNAWARE",
      },
      ROUTE_MASK
    ),
    requestRoute(buildBaseBody(origin, destination, "WALK"), ROUTE_MASK),
    requestTransitRoutes(origin, destination),
  ]);

  const driveRoute = driveRes?.routes?.[0];
  const walkRoute = walkRes?.routes?.[0];
  const transitRoute = pickBestTransitRoute(transitRoutes);

  const drive = extractRouteInfo(driveRoute);
  const walk = extractRouteInfo(walkRoute);
  const transit = await resolveTransitDetails(
    origin,
    destination,
    transitRoute
  );

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
