import { normalizeInviteCode } from "./invite-code";

const RECENT_TRIPS_KEY = "trip-planner-joined-trips";
const ACCESS_KEY_PREFIX = "trip-planner-access-";
const MAX_JOINED_TRIPS = 20;

export type JoinedTripRecord = {
  tripId: string;
  code: string;
  lastVisited: number;
};

function accessKey(tripId: string) {
  return `${ACCESS_KEY_PREFIX}${tripId}`;
}

function saveJoinedTrips(trips: JoinedTripRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      RECENT_TRIPS_KEY,
      JSON.stringify(trips.slice(0, MAX_JOINED_TRIPS))
    );
  } catch {
    /* ignore */
  }
}

/** 예전 per-trip 키만 있는 경우 목록으로 마이그레이션 */
function migrateLegacyAccessKeys(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(RECENT_TRIPS_KEY);
    if (existing) return;

    const migrated: JoinedTripRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(ACCESS_KEY_PREFIX)) continue;
      const tripId = key.slice(ACCESS_KEY_PREFIX.length);
      const code = localStorage.getItem(key);
      if (tripId && code) {
        migrated.push({
          tripId,
          code: normalizeInviteCode(code),
          lastVisited: 0,
        });
      }
    }
    if (migrated.length > 0) {
      saveJoinedTrips(migrated);
    }
  } catch {
    /* ignore */
  }
}

export function getJoinedTrips(): JoinedTripRecord[] {
  if (typeof window === "undefined") return [];
  migrateLegacyAccessKeys();
  try {
    const raw = localStorage.getItem(RECENT_TRIPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JoinedTripRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((trip) => trip.tripId && trip.code)
      .sort((a, b) => b.lastVisited - a.lastVisited);
  } catch {
    return [];
  }
}

export function getStoredTripAccessCode(tripId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(accessKey(tripId));
  } catch {
    return null;
  }
}

export function grantTripAccess(tripId: string, code: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeInviteCode(code);
  try {
    localStorage.setItem(accessKey(tripId), normalized);

    const trips = getJoinedTrips().filter((trip) => trip.tripId !== tripId);
    trips.unshift({
      tripId,
      code: normalized,
      lastVisited: Date.now(),
    });
    saveJoinedTrips(trips);
  } catch {
    /* ignore */
  }
}

export function touchJoinedTrip(tripId: string): void {
  if (typeof window === "undefined") return;
  const trips = getJoinedTrips();
  const index = trips.findIndex((trip) => trip.tripId === tripId);
  if (index === -1) return;
  trips[index].lastVisited = Date.now();
  saveJoinedTrips(trips.sort((a, b) => b.lastVisited - a.lastVisited));
}

export function removeJoinedTrip(tripId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(accessKey(tripId));
    saveJoinedTrips(getJoinedTrips().filter((trip) => trip.tripId !== tripId));
  } catch {
    /* ignore */
  }
}

export function hasTripAccess(
  tripId: string,
  inviteCode: string | null | undefined,
  creatorId?: string | null,
  currentUserId?: string
): boolean {
  if (!inviteCode) return false;

  const stored = getStoredTripAccessCode(tripId);
  if (stored && stored === normalizeInviteCode(inviteCode)) {
    return true;
  }

  if (creatorId && currentUserId && creatorId === currentUserId) {
    grantTripAccess(tripId, inviteCode);
    return true;
  }

  return false;
}

export function buildTripJoinUrl(tripId: string, inviteCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/trips/${tripId}?code=${encodeURIComponent(inviteCode)}`;
}

export function buildTripPath(tripId: string): string {
  return `/trips/${tripId}`;
}
