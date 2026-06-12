import { normalizeInviteCode } from "./invite-code";

function accessKey(tripId: string) {
  return `trip-planner-access-${tripId}`;
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
  try {
    localStorage.setItem(accessKey(tripId), normalizeInviteCode(code));
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
