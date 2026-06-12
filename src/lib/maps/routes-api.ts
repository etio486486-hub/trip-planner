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

const FUKUOKA_AIRPORT_STATION: TransitStopInfo = {
  name: "후쿠오카공항역",
  latitude: 33.5839,
  longitude: 130.451,
};

const FUKUOKA_TENJIN_STATION: TransitStopInfo = {
  name: "텐진역",
  latitude: 33.5904,
  longitude: 130.3986,
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

function isFukuokaAirportArea(lat: number, lng: number): boolean {
  return lat >= 33.57 && lat <= 33.6 && lng >= 130.44 && lng <= 130.47;
}

function isFukuokaCentralArea(lat: number, lng: number): boolean {
  return lat >= 33.575 && lat <= 33.605 && lng >= 130.385 && lng <= 130.42;
}

function isNearFukuokaAirportStation(lat: number, lng: number): boolean {
  return (
    isFukuokaAirportArea(lat, lng) ||
    haversineMeters(
      lat,
      lng,
      FUKUOKA_AIRPORT_STATION.latitude,
      FUKUOKA_AIRPORT_STATION.longitude
    ) < 3500
  );
}

function isNearFukuokaTenjinStation(lat: number, lng: number): boolean {
  return (
    isFukuokaCentralArea(lat, lng) ||
    haversineMeters(
      lat,
      lng,
      FUKUOKA_TENJIN_STATION.latitude,
      FUKUOKA_TENJIN_STATION.longitude
    ) < 4500
  );
}

function getTransitDepartureTime(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  return d.toISOString();
}

async function resolveTransitStops(
  lat: number,
  lng: number
): Promise<TransitStopInfo[]> {
  const found = await findTransitStopsNear(lat, lng, 5);
  if (found.length > 0) return found;
  if (isNearFukuokaAirportStation(lat, lng)) return [FUKUOKA_AIRPORT_STATION];
  if (isNearFukuokaTenjinStation(lat, lng)) return [FUKUOKA_TENJIN_STATION];
  return [];
}

function buildTransitRequestBody(
  origin: LatLng,
  destination: LatLng,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    ...buildBaseBody(origin, destination, "TRANSIT"),
    departureTime: getTransitDepartureTime(),
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
    departureTime: getTransitDepartureTime(),
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
      departureTime: getTransitDepartureTime(),
      regionCode: "JP",
    },
    buildTransitRequestBody(origin, destination, {
      computeAlternativeRoutes: true,
    }),
  ];

  if (originName && destinationName) {
    bodies.push(buildTransitAddressBody(originName, destinationName));
    bodies.push(
      buildTransitAddressBody(
        `${originName}, 후쿠오카 공항`,
        `${destinationName}, 후쿠오카`
      )
    );
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

function isAirportLikePlace(
  lat: number,
  lng: number,
  name: string
): boolean {
  return isNearFukuokaAirportStation(lat, lng) || isAirportLikeStop(name);
}

function isCentralLikePlace(lat: number, lng: number): boolean {
  return isNearFukuokaTenjinStation(lat, lng);
}

function isTenjinLikeStop(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("天神") || n.includes("tenjin") || n.includes("텐진");
}

function isFukuokaAirportToCentralRoute(
  origin: LatLng,
  destination: LatLng,
  originStop: TransitStopInfo,
  destStop: TransitStopInfo
): boolean {
  const fromAirport =
    isAirportLikeStop(originStop.name) ||
    isNearFukuokaAirportStation(origin.lat, origin.lng);
  const toCentral =
    isTenjinLikeStop(destStop.name) ||
    isNearFukuokaTenjinStation(destination.lat, destination.lng) ||
    isNearFukuokaTenjinStation(destStop.latitude, destStop.longitude);

  return fromAirport && toCentral;
}

function buildKnownFukuokaTransitFallback(
  origin: LatLng,
  destination: LatLng,
  originStop: TransitStopInfo,
  destStop: TransitStopInfo,
  walkTo: RouteInfo,
  walkFrom: RouteInfo
): TransitDetails | null {
  if (!isFukuokaAirportToCentralRoute(origin, destination, originStop, destStop)) {
    return null;
  }

  const alightStop = isTenjinLikeStop(destStop.name)
    ? destStop.name
    : FUKUOKA_TENJIN_STATION.name;

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
      alightStop: alightStop,
      headsign: "텐진 방면",
      duration: "약 11분",
    },
    {
      type: "WALK",
      label: `${alightStop} → 도착지 도보`,
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
    alightStop: alightStop,
    lineName: "공항선",
    headsign: "텐진 방면",
    steps: rides,
    segments,
    path,
  };
}

function buildSyntheticStationTransit(
  origin: LatLng,
  destination: LatLng,
  originStop: TransitStopInfo,
  destStop: TransitStopInfo,
  walkTo: RouteInfo,
  walkFrom: RouteInfo
): TransitDetails {
  const subwayMeters = haversineMeters(
    originStop.latitude,
    originStop.longitude,
    destStop.latitude,
    destStop.longitude
  );
  const subwayMinutes = Math.max(5, Math.round(subwayMeters / 450));
  const isAirportLine = isFukuokaAirportToCentralRoute(
    origin,
    destination,
    originStop,
    destStop
  );

  const segments: TransitSegment[] = [
    {
      type: "WALK",
      label: `출발지 → ${originStop.name} 도보`,
      duration: walkTo.duration,
    },
    {
      type: "TRANSIT",
      lineName: isAirportLine ? "福岡市地下鉄空港線" : "지하철",
      lineShort: isAirportLine ? "공항선" : "지하철",
      vehicleType: "지하철",
      boardStop: originStop.name,
      alightStop: destStop.name,
      headsign: isAirportLine ? "텐진 방면" : null,
      duration: `약 ${subwayMinutes}분`,
    },
    {
      type: "WALK",
      label: `${destStop.name} → 도착지 도보`,
      duration: walkFrom.duration,
    },
  ];

  const rides = transitRideSegments(segments);
  const durationParts = [
    walkTo.duration,
    `지하철 약 ${subwayMinutes}분`,
    walkFrom.duration,
  ].filter(Boolean);

  return {
    duration: durationParts.join(" + ") || `약 ${subwayMinutes}분`,
    fareText: isAirportLine ? "약 ¥260 (공항선 기준)" : null,
    fareYen: isAirportLine ? 260 : null,
    boardStop: originStop.name,
    alightStop: destStop.name,
    lineName: isAirportLine ? "공항선" : "지하철",
    headsign: isAirportLine ? "텐진 방면" : null,
    steps: rides,
    segments,
    path: [...walkTo.path, ...walkFrom.path],
  };
}

async function tryHybridTransitPair(
  origin: LatLng,
  destination: LatLng,
  originStop: TransitStopInfo,
  destStop: TransitStopInfo,
  originName: string,
  destinationName: string
): Promise<TransitDetails | null> {
  const originStation = {
    lat: originStop.latitude,
    lng: originStop.longitude,
  };
  const destStation = {
    lat: destStop.latitude,
    lng: destStop.longitude,
  };

  const [walkToRes, walkFromRes, stationTransitRoutes, placeTransitRoutes] =
    await Promise.all([
      requestRoute(buildBaseBody(origin, originStation, "WALK"), ROUTE_MASK),
      requestRoute(buildBaseBody(destStation, destination, "WALK"), ROUTE_MASK),
      requestTransitRoutes(
        originStation,
        destStation,
        originStop.name,
        destStop.name
      ),
      requestTransitRoutes(origin, destination, originName, destinationName),
    ]);

  const walkToRoute = walkToRes?.routes?.[0];
  const walkFromRoute = walkFromRes?.routes?.[0];
  const walkTo = extractRouteInfo(walkToRoute);
  const walkFrom = extractRouteInfo(walkFromRoute);
  const transitRoute = pickBestTransitRoute([
    ...stationTransitRoutes,
    ...placeTransitRoutes,
  ]);
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

  return (
    buildKnownFukuokaTransitFallback(
      origin,
      destination,
      originStop,
      destStop,
      walkTo,
      walkFrom
    ) ??
    buildSyntheticStationTransit(
      origin,
      destination,
      originStop,
      destStop,
      walkTo,
      walkFrom
    )
  );
}

async function buildHybridTransitFallback(
  origin: LatLng,
  destination: LatLng,
  originName: string,
  destinationName: string
): Promise<TransitDetails | null> {
  const [originStops, destStops] = await Promise.all([
    resolveTransitStops(origin.lat, origin.lng),
    resolveTransitStops(destination.lat, destination.lng),
  ]);

  if (originStops.length === 0 || destStops.length === 0) return null;

  for (const originStop of originStops) {
    for (const destStop of destStops) {
      const result = await tryHybridTransitPair(
        origin,
        destination,
        originStop,
        destStop,
        originName,
        destinationName
      );
      if (result) return result;
    }
  }

  return null;
}

async function tryDirectFukuokaAirportTransit(
  origin: LatLng,
  destination: LatLng,
  originName: string
): Promise<TransitDetails | null> {
  if (
    !isAirportLikePlace(origin.lat, origin.lng, originName) ||
    !isCentralLikePlace(destination.lat, destination.lng)
  ) {
    return null;
  }

  const originStation = FUKUOKA_AIRPORT_STATION;
  const destStation = FUKUOKA_TENJIN_STATION;
  const originStationCoord = {
    lat: originStation.latitude,
    lng: originStation.longitude,
  };
  const destStationCoord = {
    lat: destStation.latitude,
    lng: destStation.longitude,
  };

  const [walkToRes, walkFromRes] = await Promise.all([
    requestRoute(
      buildBaseBody(origin, originStationCoord, "WALK"),
      ROUTE_MASK
    ),
    requestRoute(
      buildBaseBody(destStationCoord, destination, "WALK"),
      ROUTE_MASK
    ),
  ]);

  const walkTo = extractRouteInfo(walkToRes?.routes?.[0]);
  const walkFrom = extractRouteInfo(walkFromRes?.routes?.[0]);

  return (
    buildKnownFukuokaTransitFallback(
      origin,
      destination,
      originStation,
      destStation,
      walkTo,
      walkFrom
    ) ??
    buildSyntheticStationTransit(
      origin,
      destination,
      originStation,
      destStation,
      walkTo,
      walkFrom
    )
  );
}

async function resolveTransitDetails(
  origin: LatLng,
  destination: LatLng,
  transitRoute: RouteData | undefined,
  originName: string,
  destinationName: string
): Promise<TransitDetails | null> {
  if (
    isAirportLikePlace(origin.lat, origin.lng, originName) &&
    isCentralLikePlace(destination.lat, destination.lng)
  ) {
    const directAirport = await tryDirectFukuokaAirportTransit(
      origin,
      destination,
      originName
    );
    if (directAirport) return directAirport;
  }

  const directRoutes = [
    ...(transitRoute ? [transitRoute] : []),
    ...(await requestTransitRoutes(
      origin,
      destination,
      originName,
      destinationName
    )),
  ];

  for (const route of directRoutes) {
    const direct = extractTransitDetails(route);
    if (direct && transitRideSegments(direct.segments).length > 0) {
      return direct;
    }
  }

  const hybrid = await buildHybridTransitFallback(
    origin,
    destination,
    originName,
    destinationName
  );
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
    body.departureTime = getTransitDepartureTime();
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
  originName: string,
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
    requestTransitRoutes(origin, destination, originName, destinationName),
  ]);

  const driveRoute = driveRes?.routes?.[0];
  const walkRoute = walkRes?.routes?.[0];
  const transitRoute = pickBestTransitRoute(transitRoutes);

  const drive = extractRouteInfo(driveRoute);
  const walk = extractRouteInfo(walkRoute);
  const transit = await resolveTransitDetails(
    origin,
    destination,
    transitRoute,
    originName,
    destinationName
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
