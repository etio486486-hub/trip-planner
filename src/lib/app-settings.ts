import type { MobilePanelFocus } from "@/components/trip/MobileBottomNav";

export type FontScale = 0.875 | 1 | 1.125 | 1.25;

export type AppSettings = {
  /** rem 기준 글씨 배율 — 레이아웃 비율 유지 */
  fontScale: FontScale;
  /** 모바일 여행 화면 첫 레이아웃 */
  mobileDefaultView: MobilePanelFocus;
  /** 애니메이션·전환 최소화 */
  reduceMotion: boolean;
  /** 일정 장소별 주변 맛집 섹션 기본 펼침 */
  expandNearbyRestaurants: boolean;
  /** PWA 설치 안내 배너 숨김 */
  hidePwaInstallHint: boolean;
};

export const FONT_SCALE_OPTIONS: Array<{
  value: FontScale;
  label: string;
  hint: string;
}> = [
  { value: 0.875, label: "작게", hint: "A" },
  { value: 1, label: "보통", hint: "A" },
  { value: 1.125, label: "크게", hint: "A" },
  { value: 1.25, label: "아주 크게", hint: "A" },
];

export const MOBILE_VIEW_OPTIONS: Array<{
  value: MobilePanelFocus;
  label: string;
  desc: string;
}> = [
  { value: "panel", label: "일정", desc: "일정만 전체 화면" },
  { value: "half", label: "반반", desc: "지도 + Day·일정" },
  { value: "map", label: "지도", desc: "지도만 전체 화면" },
];

const STORAGE_KEY = "trip-planner-app-settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  fontScale: 1,
  mobileDefaultView: "panel",
  reduceMotion: false,
  expandNearbyRestaurants: false,
  hidePwaInstallHint: false,
};

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_APP_SETTINGS };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      fontScale: isFontScale(parsed.fontScale)
        ? parsed.fontScale
        : DEFAULT_APP_SETTINGS.fontScale,
      mobileDefaultView: isMobileView(parsed.mobileDefaultView)
        ? parsed.mobileDefaultView
        : DEFAULT_APP_SETTINGS.mobileDefaultView,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function isFontScale(v: unknown): v is FontScale {
  return v === 0.875 || v === 1 || v === 1.125 || v === 1.25;
}

function isMobileView(v: unknown): v is MobilePanelFocus {
  return v === "map" || v === "half" || v === "panel";
}

export function applyAppSettingsToDocument(settings: AppSettings): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--app-font-scale", String(settings.fontScale));
  root.classList.toggle("app-reduce-motion", settings.reduceMotion);
}
