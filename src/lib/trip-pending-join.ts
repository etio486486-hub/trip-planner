const PENDING_JOIN_KEY = "trip-planner-pending-join";

export type PendingTripJoin = {
  tripId: string;
  code?: string;
  title?: string;
};

export function storePendingTripJoin(pending: PendingTripJoin): void {
  try {
    sessionStorage.setItem(PENDING_JOIN_KEY, JSON.stringify(pending));
  } catch {
    /* ignore */
  }
}

export function getPendingTripJoin(): PendingTripJoin | null {
  try {
    const raw = sessionStorage.getItem(PENDING_JOIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingTripJoin;
    if (!parsed?.tripId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingTripJoin(): void {
  try {
    sessionStorage.removeItem(PENDING_JOIN_KEY);
  } catch {
    /* ignore */
  }
}
