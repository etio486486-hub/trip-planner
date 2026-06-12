const USER_ID_KEY = "trip-planner-user-id";
const USER_NAME_KEY = "trip-planner-user-name";
const USER_NAME_SET_KEY = "trip-planner-name-customized";
const USER_ID_COOKIE = "trip_planner_uid";
const USER_NAME_COOKIE = "trip_planner_name";
const USER_NAME_SET_COOKIE = "trip_planner_name_set";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // 2 years

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

/** 브라우저·기기마다 고정되는 ID (localStorage + cookie 이중 저장) */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  let id = readStored(USER_ID_KEY, USER_ID_COOKIE);
  if (!id) {
    id = generateId();
  }

  writeStored(USER_ID_KEY, id, USER_ID_COOKIE);
  return id;
}

export function hasCustomDisplayName(): boolean {
  if (typeof window === "undefined") return false;
  return (
    readStored(USER_NAME_SET_KEY, USER_NAME_SET_COOKIE) === "true"
  );
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

/** 앱 로드 시 ID·이름을 storage 간 동기화 */
export function syncDeviceIdentity(): string {
  return getUserId();
}
