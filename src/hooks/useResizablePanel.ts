"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "trip-planner-panel-size";

export const PANEL_DEFAULTS = {
  sidebarWidth: 380,
  minSidebarWidth: 300,
  maxSidebarWidth: 560,
  mobilePanelPercent: 82,
  minMobilePanelPercent: 22,
  maxMobilePanelPercent: 88,
  /** map / half / panel 스냅 (panel %) */
  mobileSnap: {
    map: 25,
    half: 50,
    panel: 82,
  } as const,
} as const;

type PanelSizeState = {
  sidebarWidth: number;
  mobilePanelPercent: number;
};

function loadSaved(): PanelSizeState {
  if (typeof window === "undefined") {
    return {
      sidebarWidth: PANEL_DEFAULTS.sidebarWidth,
      mobilePanelPercent: PANEL_DEFAULTS.mobilePanelPercent,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {
      sidebarWidth: PANEL_DEFAULTS.sidebarWidth,
      mobilePanelPercent: PANEL_DEFAULTS.mobilePanelPercent,
    };
    const parsed = JSON.parse(raw) as Partial<PanelSizeState>;
    return {
      sidebarWidth: clamp(
        parsed.sidebarWidth ?? PANEL_DEFAULTS.sidebarWidth,
        PANEL_DEFAULTS.minSidebarWidth,
        PANEL_DEFAULTS.maxSidebarWidth
      ),
      mobilePanelPercent: clamp(
        parsed.mobilePanelPercent ?? PANEL_DEFAULTS.mobilePanelPercent,
        PANEL_DEFAULTS.minMobilePanelPercent,
        PANEL_DEFAULTS.maxMobilePanelPercent
      ),
    };
  } catch {
    return {
      sidebarWidth: PANEL_DEFAULTS.sidebarWidth,
      mobilePanelPercent: PANEL_DEFAULTS.mobilePanelPercent,
    };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 드래그 후 패널 비율 → 지도/반반/일정 포커스 */
export function inferMobileFocusFromPanelPercent(
  panelPercent: number
): "map" | "half" | "panel" {
  const mapPercent = 100 - panelPercent;
  if (mapPercent >= 58) return "map";
  if (mapPercent >= 38) return "half";
  return "panel";
}

export function useResizablePanel() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    PANEL_DEFAULTS.sidebarWidth
  );
  const [mobilePanelPercent, setMobilePanelPercent] = useState<number>(
    PANEL_DEFAULTS.mobilePanelPercent
  );

  useEffect(() => {
    const saved = loadSaved();
    setSidebarWidth(saved.sidebarWidth);
    setMobilePanelPercent(saved.mobilePanelPercent);

    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const persist = useCallback(
    (next: Partial<PanelSizeState>) => {
      const merged = {
        sidebarWidth: next.sidebarWidth ?? sidebarWidth,
        mobilePanelPercent: next.mobilePanelPercent ?? mobilePanelPercent,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
    },
    [sidebarWidth, mobilePanelPercent]
  );

  const resizeSidebar = useCallback(
    (width: number) => {
      const next = clamp(
        width,
        PANEL_DEFAULTS.minSidebarWidth,
        PANEL_DEFAULTS.maxSidebarWidth
      );
      setSidebarWidth(next);
      persist({ sidebarWidth: next });
    },
    [persist]
  );

  const resizeMobilePanel = useCallback(
    (percent: number) => {
      const next = clamp(
        percent,
        PANEL_DEFAULTS.minMobilePanelPercent,
        PANEL_DEFAULTS.maxMobilePanelPercent
      );
      setMobilePanelPercent(next);
      persist({ mobilePanelPercent: next });
    },
    [persist]
  );

  return {
    isMobile,
    sidebarWidth,
    mobilePanelPercent,
    resizeSidebar,
    resizeMobilePanel,
    mapHeightPercent: 100 - mobilePanelPercent,
  };
}
