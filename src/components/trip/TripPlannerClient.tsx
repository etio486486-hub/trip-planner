"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useTripRouteMap } from "@/hooks/useTripRouteMap";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import type { RouteViewMode } from "@/lib/maps/segment-colors";
import { DeviceIdentityGuard } from "./DeviceIdentityGuard";
import { MapsProvider } from "./MapsProvider";
import { TripMap } from "./TripMap";
import { MemberNameModal } from "./MemberNameModal";
import { TripSidebar } from "./TripSidebar";

type TripPlannerClientProps = {
  tripId: string;
};

function TripPlannerContent({ tripId }: TripPlannerClientProps) {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [routeViewMode, setRouteViewMode] = useState<RouteViewMode>("DRIVE");

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

  const { segments: routeSegments, loading: routesLoading } = useTripRouteMap(
    places,
    routeViewMode
  );

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

  return (
    <MapsProvider>
      <MemberNameModal
        open={needsNameSetup}
        onSave={joinTripAsMember}
      />
      <div className="flex h-screen w-full flex-col">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <TripSidebar
            tripId={tripId}
            trip={trip}
            dailyPlans={dailyPlans}
            places={places}
            members={members}
            onlineUsers={onlineUsers}
            selectedDayNumber={selectedDayNumber}
            loading={loading}
            onSelectDay={(day) => {
              setSelectedDayNumber(day);
              setFocusedPlaceId(null);
            }}
            onAddDay={handleAddDay}
            onRemoveDay={handleRemoveDay}
            onUpdateTrip={updateTrip}
            onAddPlace={addPlace}
            onDeletePlace={handleDeletePlace}
            onReorderPlaces={handleReorderPlaces}
            selectedPlaceId={focusedPlaceId}
            onSelectPlace={setFocusedPlaceId}
            currentUserId={currentUserId}
            creatorId={trip?.creator_id ?? null}
            onUpdateDisplayName={updateDisplayName}
            onKickMember={handleKickMember}
            routeViewMode={routeViewMode}
            onRouteViewModeChange={setRouteViewMode}
          />
          <main className="relative flex-1">
            <TripMap
              places={places}
              focusedPlaceId={focusedPlaceId}
              routeSegments={routeSegments}
              routeViewMode={routeViewMode}
              onRouteViewModeChange={setRouteViewMode}
              routesLoading={routesLoading}
            />
          </main>
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
