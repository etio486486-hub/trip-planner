"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import {
  buildMapSegments,
  getSegmentModeKey,
  isSegmentVisible,
  useTripRouteLegs,
} from "@/hooks/useTripRouteLegs";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import type { RouteViewMode } from "@/lib/maps/segment-colors";
import { DeviceIdentityGuard } from "./DeviceIdentityGuard";
import { MapsProvider } from "./MapsProvider";
import { TripMap } from "./TripMap";
import { MemberNameModal } from "./MemberNameModal";
import { MobileMapPanelToggle } from "./MobileMapPanelToggle";
import { PanelResizeHandle } from "./PanelResizeHandle";
import { TripSidebar } from "./TripSidebar";
import type { SidebarTab } from "./TripMenuTabs";

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
  const [mobileFocus, setMobileFocus] = useState<"map" | "panel">("panel");

  const {
    isMobile,
    sidebarWidth,
    mobilePanelPercent,
    resizeSidebar,
    resizeMobilePanel,
    mapHeightPercent,
  } = useResizablePanel();

  const handleMobileFocusChange = useCallback(
    (focus: "map" | "panel") => {
      setMobileFocus(focus);
      if (focus === "map") resizeMobilePanel(28);
      else resizeMobilePanel(72);
    },
    [resizeMobilePanel]
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
    deletePlace,
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
    onDeletePlace: handleDeletePlace,
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
    onSidebarTabChange: setSidebarTab,
  };

  const mapProps = {
    places,
    focusedPlaceId,
    routeSegments: visibleRouteSegments,
    routesLoading,
  };

  return (
    <MapsProvider>
      <MemberNameModal
        open={needsNameSetup}
        onSave={joinTripAsMember}
      />
      <div className="flex h-dvh w-full flex-col">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div
          className={`flex flex-1 overflow-hidden ${
            isMobile ? "flex-col" : "flex-row"
          }`}
        >
          {isMobile ? (
            <>
              <main
                className="relative min-h-0 w-full"
                style={{ height: `${mapHeightPercent}%` }}
              >
                <TripMap {...mapProps} />
                <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                  <MobileMapPanelToggle
                    focus={mobileFocus}
                    onFocusChange={handleMobileFocusChange}
                  />
                </div>
              </main>
              <PanelResizeHandle
                direction="vertical"
                onResize={(delta) => {
                  if (typeof window === "undefined") return;
                  const deltaPercent = (delta / window.innerHeight) * 100;
                  resizeMobilePanel(mobilePanelPercent + deltaPercent);
                  setMobileFocus("panel");
                }}
              />
              <div
                className="min-h-0 w-full overflow-hidden"
                style={{ height: `${mobilePanelPercent}%` }}
              >
                <TripSidebar {...sidebarProps} />
              </div>
            </>
          ) : (
            <>
              <div
                className="h-full shrink-0 overflow-hidden"
                style={{ width: sidebarWidth }}
              >
                <TripSidebar {...sidebarProps} />
              </div>
              <PanelResizeHandle
                direction="horizontal"
                onResize={(delta) => resizeSidebar(sidebarWidth + delta)}
              />
              <main className="relative min-w-0 flex-1">
                <TripMap {...mapProps} />
              </main>
            </>
          )}
        </div>
      </div>
    </MapsProvider>
  );
}

export function TripPlannerClient({ tripId }: TripPlannerClientProps) {
  return (
    <DeviceIdentityGuard>
      <TripPlannerContent tripId={tripId} />
    </DeviceIdentityGuard>
  );
}
