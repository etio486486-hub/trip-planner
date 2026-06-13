/** 홈 버튼으로 명시적으로 돌아온 경우 1회 자동 여행 이동 스킵 */
export const PREFER_HOME_SESSION_KEY = "trip-planner-prefer-home";

export function markPreferHome(): void {
  try {
    sessionStorage.setItem(PREFER_HOME_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumePreferHome(): boolean {
  try {
    const v = sessionStorage.getItem(PREFER_HOME_SESSION_KEY);
    if (v === "1") {
      sessionStorage.removeItem(PREFER_HOME_SESSION_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** OAuth 직후 등 — 여행 1개면 바로 이동 (홈 버튼 의도와 구분) */
export const AUTO_OPEN_SINGLE_TRIP_KEY = "trip-planner-auto-open-single-trip";

export function markAutoOpenSingleTrip(): void {
  try {
    sessionStorage.setItem(AUTO_OPEN_SINGLE_TRIP_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeAutoOpenSingleTrip(): boolean {
  try {
    const v = sessionStorage.getItem(AUTO_OPEN_SINGLE_TRIP_KEY);
    if (v === "1") {
      sessionStorage.removeItem(AUTO_OPEN_SINGLE_TRIP_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
