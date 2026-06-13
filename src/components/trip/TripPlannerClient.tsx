"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  inferMobileFocusFromPanelPercent,
  PANEL_DEFAULTS,
  useResizablePanel,
} from "@/hooks/useResizablePanel";
import {
  buildMapSegments,
  getSegmentModeKey,
  isSegmentVisible,
  useTripRouteLegs,
} from "@/hooks/useTripRouteLegs";
import { useTripChecklist } from "@/hooks/useTripChecklist";
import { useTripExpenses } from "@/hooks/useTripExpenses";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import type { RouteViewMode } from "@/lib/maps/segment-colors";
import { DeviceIdentityGuard } from "./DeviceIdentityGuard";
import { TripJoinGate } from "./TripJoinGate";
import { MapsProvider } from "./MapsProvider";
import { TripChatWidget } from "./TripChatWidget";
import { TripMap } from "./TripMap";
import { MemberNameModal } from "./MemberNameModal";
import { MobileMapPanelToggle } from "./MobileMapPanelToggle";
import {
  MobileBottomNav,
  type MobilePanelFocus,
} from "./MobileBottomNav";
import { MobileInstallHint } from "./MobileInstallHint";
import { MapFeatureButtons } from "./MapFeatureButtons";
import { PanelResizeHandle } from "./PanelResizeHandle";
import { RestaurantMapProvider } from "./RestaurantMapContext";
import { TripSidebar } from "./TripSidebar";
import type { SidebarTab } from "./TripMenuTabs";
import { getDestinationTheme } from "@/lib/trip-destination-theme";

type TripPlannerClientProps = {
  tripId: string;
};

function TripPlannerContent({ tripId }: TripPlannerClientProps) {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [segmentModes, setSegmentModes] = useState<
    Record<string, RouteViewMode>
  >({});
  const [segmentVisibility, setSegmentVisibility] = useState<
    Record<string, boolean>
  >({});
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("itinerary");
  const [mobileFocus, setMobileFocus] = useState<MobilePanelFocus>("panel");

  const {
    isMobile,
    sidebarWidth,
    mobilePanelPercent,
    resizeSidebar,
    resizeMobilePanel,
    mapHeightPercent,
  } = useResizablePanel();

  const handleMobileFocusChange = useCallback(
    (focus: MobilePanelFocus) => {
      setMobileFocus(focus);
      resizeMobilePanel(PANEL_DEFAULTS.mobileSnap[focus]);
    },
    [resizeMobilePanel]
  );

  const syncMobileFocusFromPanel = useCallback(
    (panelPercent: number) => {
      setMobileFocus(inferMobileFocusFromPanelPercent(panelPercent));
    },
    []
  );

  const {
    trip,
    dailyPlans,
    places,
    members,
    onlineUsers,
    loading,
    error,
    addPlace,
    addPlaceToDay,
    ensureDaysUpTo,
    deletePlace,
    updatePlace,
    reorderPlaces,
    addDay,
    removeDay,
    updateTrip,
    needsNameSetup,
    joinTripAsMember,
    updateDisplayName,
    kickMember,
    currentUserId,
  } = useTripRealtime({ tripId, selectedDayNumber });

  const { legs: routeLegs, loading: routesLoading } = useTripRouteLegs(places);
  const checklist = useTripChecklist(tripId, currentUserId);
  const expenses = useTripExpenses(tripId);
  const routeSegments = useMemo(
    () => buildMapSegments(routeLegs, places, segmentModes),
    [routeLegs, places, segmentModes]
  );

  const visibleRouteSegments = useMemo(
    () =>
      routeSegments.filter((seg) =>
        isSegmentVisible(segmentVisibility, seg.fromId, seg.toId)
      ),
    [routeSegments, segmentVisibility]
  );

  const chatSenderName = useMemo(() => {
    const member = members.find((m) => m.user_id === currentUserId);
    return member?.display_name?.trim() || "나";
  }, [members, currentUserId]);

  const destinationTheme = useMemo(
    () => getDestinationTheme(trip?.title),
    [trip?.title]
  );

  const handleSegmentModeChange = (
    fromId: string,
    toId: string,
    mode: RouteViewMode
  ) => {
    setSegmentModes((prev) => ({
      ...prev,
      [getSegmentModeKey(fromId, toId)]: mode,
    }));
  };

  const handleSegmentVisibilityChange = (
    fromId: string,
    toId: string,
    visible: boolean
  ) => {
    setSegmentVisibility((prev) => ({
      ...prev,
      [getSegmentModeKey(fromId, toId)]: visible,
    }));
  };

  const handleShowOnlySegment = (fromId: string, toId: string) => {
    const next: Record<string, boolean> = {};
    for (const leg of routeLegs) {
      const key = getSegmentModeKey(leg.fromId, leg.toId);
      next[key] = leg.fromId === fromId && leg.toId === toId;
    }
    setSegmentVisibility(next);
  };

  const handleShowAllSegments = () => {
    setSegmentVisibility({});
  };

  const handleDeletePlace = async (id: string) => {
    try {
      await deletePlace(id);
      if (focusedPlaceId === id) {
        setFocusedPlaceId(null);
      }
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "장소 삭제에 실패했습니다."
      );
    }
  };

  const handleReorderPlaces = async (ids: string[]) => {
    try {
      await reorderPlaces(ids);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDay = async () => {
    try {
      const nextDay = await addDay();
      setSelectedDayNumber(nextDay);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveDay = async (dayNumber: number) => {
    try {
      const nextDay = await removeDay(dayNumber);
      setSelectedDayNumber(nextDay);
      setFocusedPlaceId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickMember = async (memberId: string) => {
    try {
      await kickMember(memberId);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "강퇴에 실패했습니다.");
    }
  };

  const handleSidebarTabChange = useCallback(
    (tab: SidebarTab) => {
      setSidebarTab(tab);
      if (isMobile) {
        handleMobileFocusChange("panel");
      }
    },
    [isMobile, handleMobileFocusChange]
  );

  const sidebarProps = {
    tripId,
    trip,
    dailyPlans,
    places,
    members,
    onlineUsers,
    selectedDayNumber,
    loading,
    onSelectDay: (day: number) => {
      setSelectedDayNumber(day);
      setFocusedPlaceId(null);
    },
    onAddDay: handleAddDay,
    onRemoveDay: handleRemoveDay,
    onUpdateTrip: updateTrip,
    onAddPlace: addPlace,
    onAddPlaceToDay: addPlaceToDay,
    onEnsureDaysUpTo: ensureDaysUpTo,
    onDeletePlace: handleDeletePlace,
    onUpdatePlace: updatePlace,
    onReorderPlaces: handleReorderPlaces,
    selectedPlaceId: focusedPlaceId,
    onSelectPlace: setFocusedPlaceId,
    currentUserId,
    creatorId: trip?.creator_id ?? null,
    onUpdateDisplayName: updateDisplayName,
    onKickMember: handleKickMember,
    routeLegs,
    segmentModes,
    onSegmentModeChange: handleSegmentModeChange,
    segmentVisibility,
    onSegmentVisibilityChange: handleSegmentVisibilityChange,
    onShowOnlySegment: handleShowOnlySegment,
    onShowAllSegments: handleShowAllSegments,
    sidebarTab,
    checklist,
    expenses,
  };

  const mapProps = {
    places,
    focusedPlaceId,
    routeSegments: visibleRouteSegments,
    routesLoading,
    onPlaceClick: (placeId: string) => {
      setFocusedPlaceId((prev) => (prev === placeId ? null : placeId));
    },
  };

  return (
    <MapsProvider>
      <RestaurantMapProvider
        places={places}
        onAddPlace={addPlace}
        onFocusMap={
          isMobile ? () => handleMobileFocusChange("map") : undefined
        }
      >
      <MemberNameModal
        open={needsNameSetup}
        onSave={joinTripAsMember}
      />
      <div className="trip-shell fixed inset-0 flex h-dvh w-full flex-col pt-[env(safe-area-inset-top)] lg:static lg:pt-0">
        <div className="trip-shell-bg pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`hero-mesh absolute -left-[15%] top-[-8%] h-[480px] w-[480px] rounded-full blur-[100px] ${destinationTheme.mesh}`}
          />
          <div className="hero-mesh-delay absolute -right-[10%] bottom-[5%] h-[420px] w-[420px] rounded-full bg-indigo-400/12 blur-[100px]" />
          <div className="home-dot-grid absolute inset-0 opacity-30" />
        </div>

        {error && (
          <div className="relative z-10 flex items-center gap-2 bg-red-50/95 px-4 py-2 text-sm text-red-700 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div
          className={`relative z-[1] flex flex-1 overflow-hidden ${
            isMobile ? "flex-col" : "flex-row p-2 gap-0"
          }`}
        >
          {isMobile ? (
            <>
              <main
                className="relative min-h-0 w-full overflow-hidden rounded-t-2xl ring-1 ring-white/70 shadow-lg"
                style={{
                  flex: `0 0 ${mapHeightPercent}%`,
                  minHeight: "22%",
                  maxHeight: "78%",
                }}
              >
                <TripMap {...mapProps} />
              </main>
              <div className="relative z-20 shrink-0">
                <PanelResizeHandle
                  direction="vertical"
                  onResize={(delta) => {
                    if (typeof window === "undefined") return;
                    const deltaPercent = (delta / window.innerHeight) * 100;
                    const next = Math.min(
                      PANEL_DEFAULTS.maxMobilePanelPercent,
                      Math.max(
                        PANEL_DEFAULTS.minMobilePanelPercent,
                        mobilePanelPercent + deltaPercent
                      )
                    );
                    resizeMobilePanel(next);
                    syncMobileFocusFromPanel(next);
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-center px-3">
                  <MobileMapPanelToggle
                    focus={mobileFocus}
                    onFocusChange={handleMobileFocusChange}
                  />
                </div>
              </div>
              <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-t-2xl bg-white/90 shadow-[0_-8px_32px_-8px_rgba(15,23,42,0.12)] ring-1 ring-white/80 backdrop-blur-xl mobile-panel-with-nav">
                <TripSidebar {...sidebarProps} isMobile />
              </div>
              <MobileBottomNav
                activeTab={sidebarTab}
                panelFocus={mobileFocus}
                onTabChange={handleSidebarTabChange}
                onFocusMap={() => handleMobileFocusChange("map")}
                onFocusPanel={() => handleMobileFocusChange("panel")}
              />
              <MobileInstallHint />
              {currentUserId && (
                <TripChatWidget
                  tripId={tripId}
                  currentUserId={currentUserId}
                  senderName={chatSenderName}
                  isMobile
                />
              )}
            </>
          ) : (
            <>
              <div
                className="trip-enter h-full shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/80 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)]"
                style={{ width: sidebarWidth }}
              >
                <TripSidebar {...sidebarProps} />
              </div>
              <PanelResizeHandle
                direction="horizontal"
                onResize={(delta) => resizeSidebar(sidebarWidth + delta)}
              />
              <main className="relative min-w-0 flex-1 overflow-hidden rounded-2xl trip-map-frame ring-1 ring-white/80">
                <TripMap {...mapProps} />
                <MapFeatureButtons
                  activeTab={sidebarTab}
                  onTabChange={handleSidebarTabChange}
                  layout="vertical"
                />
                {currentUserId && (
                  <TripChatWidget
                    tripId={tripId}
                    currentUserId={currentUserId}
                    senderName={chatSenderName}
                  />
                )}
              </main>
            </>
          )}
        </div>
      </div>
      </RestaurantMapProvider>
    </MapsProvider>
  );
}

export function TripPlannerClient({ tripId }: TripPlannerClientProps) {
  return (
    <DeviceIdentityGuard>
      <TripJoinGate tripId={tripId}>
        <TripPlannerContent tripId={tripId} />
      </TripJoinGate>
    </DeviceIdentityGuard>
  );
}
