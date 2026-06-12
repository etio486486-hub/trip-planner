const USER_ID_KEY = "trip-planner-user-id";
const USER_NAME_KEY = "trip-planner-user-name";
const USER_NAME_SET_KEY = "trip-planner-name-customized";
const USER_ID_COOKIE = "trip_planner_uid";
const USER_NAME_COOKIE = "trip_planner_name";
const USER_NAME_SET_COOKIE = "trip_planner_name_set";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // 2 years

function tripBoundKey(tripId: string) {
  return `trip-planner-bound-${tripId}`;
}

function tripHistoryKey(tripId: string) {
  return `trip-planner-history-${tripId}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    if (key === name) {
      return decodeURIComponent(part.slice(eq + 1));
    }
  }
  return null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function readStored(key: string, cookieName?: string): string | null {
  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) return fromLocal;
  } catch {
    /* private mode */
  }

  if (cookieName) {
    const fromCookie = readCookie(cookieName);
    if (fromCookie) return fromCookie;
  }

  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string, cookieName?: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }

  if (cookieName) {
    writeCookie(cookieName, value);
  }

  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function getTripUserHistory(tripId: string): string[] {
  try {
    const raw = readStored(tripHistoryKey(tripId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function setTripUserHistory(tripId: string, userIds: string[]) {
  writeStored(tripHistoryKey(tripId), JSON.stringify([...new Set(userIds)]));
}

function recordTripUserId(tripId: string, userId: string) {
  if (!userId) return;
  setTripUserHistory(tripId, [...getTripUserHistory(tripId), userId]);
}

/** 브라우저·기기마다 고정되는 ID */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  let id = readStored(USER_ID_KEY, USER_ID_COOKIE);
  if (!id) {
    id = generateId();
  }

  writeStored(USER_ID_KEY, id, USER_ID_COOKIE);
  return id;
}

type MemberRow = { user_id: string; display_name: string | null };

/**
 * 여행별로 한 번 정해진 계정 ID를 재사용.
 * 링크를 여러 번 열어도 같은 trip_members 행을 갱신한다.
 */
export function getUserIdForTrip(
  tripId: string,
  existingMembers?: MemberRow[]
): string {
  if (typeof window === "undefined") return "";

  const boundKey = tripBoundKey(tripId);
  const boundId = readStored(boundKey);

  if (boundId) {
    writeStored(USER_ID_KEY, boundId, USER_ID_COOKIE);
    recordTripUserId(tripId, boundId);
    return boundId;
  }

  const myName = getUserDisplayName();
  if (myName && existingMembers?.length) {
    const sameName = existingMembers.filter((m) => m.display_name === myName);
    if (sameName.length >= 1) {
      const recovered = sameName[0].user_id;
      writeStored(boundKey, recovered);
      writeStored(USER_ID_KEY, recovered, USER_ID_COOKIE);
      recordTripUserId(tripId, recovered);
      return recovered;
    }
  }

  const history = getTripUserHistory(tripId);
  if (history.length > 0) {
    const fromHistory = history[history.length - 1];
    writeStored(boundKey, fromHistory);
    writeStored(USER_ID_KEY, fromHistory, USER_ID_COOKIE);
    return fromHistory;
  }

  const id = getUserId();
  writeStored(boundKey, id);
  recordTripUserId(tripId, id);
  return id;
}

export function bindUserToTrip(tripId: string, userId: string) {
  if (typeof window === "undefined" || !userId) return;
  writeStored(tripBoundKey(tripId), userId);
  writeStored(USER_ID_KEY, userId, USER_ID_COOKIE);
  setTripUserHistory(tripId, [userId]);
}

/** 이 기기에서 이 여행에 쓰던 옛 ID 목록 (중복 멤버 정리용) */
export function getDeviceMemberIdsForTrip(tripId: string): string[] {
  return getTripUserHistory(tripId);
}

export function hasCustomDisplayName(): boolean {
  if (typeof window === "undefined") return false;
  return readStored(USER_NAME_SET_KEY, USER_NAME_SET_COOKIE) === "true";
}

export function getUserDisplayName(): string {
  if (typeof window === "undefined") return "익명";
  return readStored(USER_NAME_KEY, USER_NAME_COOKIE) ?? "";
}

export function setUserDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (!trimmed) return;
  writeStored(USER_NAME_KEY, trimmed, USER_NAME_COOKIE);
  writeStored(USER_NAME_SET_KEY, "true", USER_NAME_SET_COOKIE);
}

export function syncDeviceIdentity(): string {
  return getUserId();
}
