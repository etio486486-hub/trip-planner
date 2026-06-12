"use client";

import { Loader2 } from "lucide-react";
import { DayTabs } from "./DayTabs";
import { TripHeader } from "./TripHeader";
import { InviteMembers } from "./InviteMembers";
import { MemberList } from "./MemberList";
import { PlaceList } from "./PlaceList";
import { PlaceSearch } from "./PlaceSearch";
import type { RouteViewMode } from "@/lib/maps/segment-colors";
import type { DailyPlan, Place, PresenceUser, Trip, TripMember } from "@/types/database";
import type { PlaceInput } from "@/types/database";

type TripSidebarProps = {
  tripId: string;
  trip: Trip | null;
  dailyPlans: DailyPlan[];
  places: Place[];
  members: TripMember[];
  onlineUsers: PresenceUser[];
  selectedDayNumber: number;
  loading: boolean;
  onSelectDay: (day: number) => void;
  onAddDay: () => void;
  onRemoveDay: (dayNumber: number) => void;
  onUpdateTrip: (data: {
    title: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
  onAddPlace: (place: PlaceInput) => Promise<void>;
  onDeletePlace: (id: string) => void;
  onReorderPlaces: (ids: string[]) => void;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  currentUserId: string;
  creatorId: string | null;
  onUpdateDisplayName: (name: string) => Promise<void>;
  onKickMember: (memberId: string) => Promise<void>;
  routeViewMode: RouteViewMode;
  onRouteViewModeChange: (mode: RouteViewMode) => void;
};

export function TripSidebar({
  tripId,
  trip,
  dailyPlans,
  places,
  members,
  onlineUsers,
  selectedDayNumber,
  loading,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  onUpdateTrip,
  onAddPlace,
  onDeletePlace,
  onReorderPlaces,
  selectedPlaceId,
  onSelectPlace,
  currentUserId,
  creatorId,
  onUpdateDisplayName,
  onKickMember,
  routeViewMode,
  onRouteViewModeChange,
}: TripSidebarProps) {
  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-zinc-200 bg-white">
      <TripHeader trip={trip} onUpdate={onUpdateTrip} />

      <InviteMembers tripId={tripId} />
      <MemberList
        members={members}
        onlineUsers={onlineUsers}
        currentUserId={currentUserId}
        creatorId={creatorId}
        onUpdateName={onUpdateDisplayName}
        onKickMember={onKickMember}
      />

      <DayTabs
        dailyPlans={dailyPlans}
        selectedDayNumber={selectedDayNumber}
        onSelectDay={onSelectDay}
        onAddDay={onAddDay}
        onRemoveDay={onRemoveDay}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PlaceList
              places={places}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={onSelectPlace}
              onReorder={onReorderPlaces}
              onDelete={onDeletePlace}
              routeViewMode={routeViewMode}
              onRouteViewModeChange={onRouteViewModeChange}
            />
          </div>
        )}
      </div>

      <PlaceSearch onAdd={onAddPlace} />
    </aside>
  );
}
