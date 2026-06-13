"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MobilePanelFocus } from "@/components/trip/MobileBottomNav";
import {
  applyAppSettingsToDocument,
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
  type FontScale,
} from "@/lib/app-settings";

type SettingsContextValue = {
  settings: AppSettings;
  setFontScale: (scale: FontScale) => void;
  setMobileDefaultView: (view: MobilePanelFocus) => void;
  setReduceMotion: (value: boolean) => void;
  setExpandNearbyRestaurants: (value: boolean) => void;
  setHidePwaInstallHint: (value: boolean) => void;
  resetSettings: () => void;
  /** 여행 화면에서 레이아웃 즉시 반영 */
  registerMobileViewHandler: (handler: ((view: MobilePanelFocus) => void) | null) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    typeof window !== "undefined" ? loadAppSettings() : DEFAULT_APP_SETTINGS
  );
  const mobileViewHandlerRef = useRef<((view: MobilePanelFocus) => void) | null>(
    null
  );

  useEffect(() => {
    applyAppSettingsToDocument(settings);
  }, [settings]);

  const persist = useCallback((next: AppSettings, applyMobileView = false) => {
    setSettings(next);
    saveAppSettings(next);
    applyAppSettingsToDocument(next);
    if (applyMobileView && mobileViewHandlerRef.current) {
      mobileViewHandlerRef.current(next.mobileDefaultView);
    }
  }, []);

  const registerMobileViewHandler = useCallback(
    (handler: ((view: MobilePanelFocus) => void) | null) => {
      mobileViewHandlerRef.current = handler;
    },
    []
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setFontScale: (fontScale) => persist({ ...settings, fontScale }),
      setMobileDefaultView: (mobileDefaultView) =>
        persist({ ...settings, mobileDefaultView }, true),
      setReduceMotion: (reduceMotion) => persist({ ...settings, reduceMotion }),
      setExpandNearbyRestaurants: (expandNearbyRestaurants) =>
        persist({ ...settings, expandNearbyRestaurants }),
      setHidePwaInstallHint: (hidePwaInstallHint) =>
        persist({ ...settings, hidePwaInstallHint }),
      resetSettings: () => {
        persist({ ...DEFAULT_APP_SETTINGS }, true);
      },
      registerMobileViewHandler,
    }),
    [settings, persist, registerMobileViewHandler]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used within SettingsProvider");
  }
  return ctx;
}
