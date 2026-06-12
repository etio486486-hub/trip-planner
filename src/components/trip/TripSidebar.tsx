"use client";

import { Loader2 } from "lucide-react";
import { ChecklistPanel } from "./ChecklistPanel";
import { CollapsibleSection } from "./CollapsibleSection";
import { DayTabs } from "./DayTabs";
import { ExpensePanel } from "./ExpensePanel";
import { TripHeader } from "./TripHeader";
import { InviteMembers } from "./InviteMembers";
import { MemberList } from "./MemberList";
import { PlaceList } from "./PlaceList";
import { PlaceSearch } from "./PlaceSearch";
import { TripMenuTabs, type SidebarTab } from "./TripMenuTabs";
import type { useTripChecklist } from "@/hooks/useTripChecklist";
import type { useTripExpenses } from "@/hooks/useTripExpenses";
import type { SegmentLegState } from "@/hooks/useTripRouteLegs";
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
  routeLegs: SegmentLegState[];
  segmentModes: Record<string, RouteViewMode>;
  onSegmentModeChange: (
    fromId: string,
    toId: string,
    mode: RouteViewMode
  ) => void;
  segmentVisibility: Record<string, boolean>;
  onSegmentVisibilityChange: (
    fromId: string,
    toId: string,
    visible: boolean
  ) => void;
  onShowOnlySegment: (fromId: string, toId: string) => void;
  onShowAllSegments: () => void;
  sidebarTab: SidebarTab;
  onSidebarTabChange: (tab: SidebarTab) => void;
  checklist: ReturnType<typeof useTripChecklist>;
  expenses: ReturnType<typeof useTripExpenses>;
  isMobile?: boolean;
};

function ItineraryContent({
  loading,
  places,
  selectedPlaceId,
  onSelectPlace,
  onReorderPlaces,
  onDeletePlace,
  routeLegs,
  segmentModes,
  onSegmentModeChange,
  segmentVisibility,
  onSegmentVisibilityChange,
  onShowOnlySegment,
  onShowAllSegments,
  onAddPlace,
  isMobile,
}: {
  loading: boolean;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  onReorderPlaces: (ids: string[]) => void;
  onDeletePlace: (id: string) => void;
  routeLegs: SegmentLegState[];
  segmentModes: Record<string, RouteViewMode>;
  onSegmentModeChange: (
    fromId: string,
    toId: string,
    mode: RouteViewMode
  ) => void;
  segmentVisibility: Record<string, boolean>;
  onSegmentVisibilityChange: (
    fromId: string,
    toId: string,
    visible: boolean
  ) => void;
  onShowOnlySegment: (fromId: string, toId: string) => void;
  onShowAllSegments: () => void;
  onAddPlace: (place: PlaceInput) => Promise<void>;
  isMobile?: boolean;
}) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <PlaceList
              places={places}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={onSelectPlace}
              onReorder={onReorderPlaces}
              onDelete={onDeletePlace}
              routeLegs={routeLegs}
              segmentModes={segmentModes}
              onSegmentModeChange={onSegmentModeChange}
              segmentVisibility={segmentVisibility}
              onSegmentVisibilityChange={onSegmentVisibilityChange}
              onShowOnlySegment={onShowOnlySegment}
              onShowAllSegments={onShowAllSegments}
            />
          </div>
        )}
      </div>

      <div
        className={
          isMobile
            ? "shrink-0 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]"
            : undefined
        }
      >
        <PlaceSearch onAdd={onAddPlace} compact={isMobile} />
      </div>
    </>
  );
}

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
  routeLegs,
  segmentModes,
  onSegmentModeChange,
  segmentVisibility,
  onSegmentVisibilityChange,
  onShowOnlySegment,
  onShowAllSegments,
  sidebarTab,
  onSidebarTabChange,
  checklist,
  expenses,
  isMobile = false,
}: TripSidebarProps) {
  const onlineCount = onlineUsers.length;
  const teamSummary = `멤버 ${members.length}명${onlineCount > 0 ? ` · 온라인 ${onlineCount}` : ""}`;

  if (isMobile) {
    return (
      <aside className="flex h-full w-full min-w-0 flex-col bg-white">
        <TripHeader trip={trip} onUpdate={onUpdateTrip} compact />

        <CollapsibleSection title="팀 · 초대" summary={teamSummary}>
          <InviteMembers tripId={tripId} compact />
          <MemberList
            members={members}
            onlineUsers={onlineUsers}
            currentUserId={currentUserId}
            creatorId={creatorId}
            onUpdateName={onUpdateDisplayName}
            onKickMember={onKickMember}
            compact
          />
        </CollapsibleSection>

        <div className="sticky top-0 z-10 shrink-0 bg-white shadow-sm ring-1 ring-zinc-100">
          <TripMenuTabs
            activeTab={sidebarTab}
            onTabChange={onSidebarTabChange}
            compact
          />
          {sidebarTab === "itinerary" && (
            <DayTabs
              dailyPlans={dailyPlans}
              selectedDayNumber={selectedDayNumber}
              onSelectDay={onSelectDay}
              onAddDay={onAddDay}
              onRemoveDay={onRemoveDay}
              compact
            />
          )}
        </div>

        {sidebarTab === "itinerary" && (
          <ItineraryContent
            loading={loading}
            places={places}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={onSelectPlace}
            onReorderPlaces={onReorderPlaces}
            onDeletePlace={onDeletePlace}
            routeLegs={routeLegs}
            segmentModes={segmentModes}
            onSegmentModeChange={onSegmentModeChange}
            segmentVisibility={segmentVisibility}
            onSegmentVisibilityChange={onSegmentVisibilityChange}
            onShowOnlySegment={onShowOnlySegment}
            onShowAllSegments={onShowAllSegments}
            onAddPlace={onAddPlace}
            isMobile
          />
        )}

        {sidebarTab === "checklist" && (
          <ChecklistPanel checklist={checklist} isMobile />
        )}
        {sidebarTab === "budget" && (
          <ExpensePanel
            expenses={expenses}
            members={members}
            currentUserId={currentUserId}
            tripStartDate={trip?.start_date}
            tripEndDate={trip?.end_date}
            isMobile
          />
        )}
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-zinc-200 bg-white lg:border-r">
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

      <TripMenuTabs activeTab={sidebarTab} onTabChange={onSidebarTabChange} />

      {sidebarTab === "itinerary" && (
        <>
          <DayTabs
            dailyPlans={dailyPlans}
            selectedDayNumber={selectedDayNumber}
            onSelectDay={onSelectDay}
            onAddDay={onAddDay}
            onRemoveDay={onRemoveDay}
          />

          <ItineraryContent
            loading={loading}
            places={places}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={onSelectPlace}
            onReorderPlaces={onReorderPlaces}
            onDeletePlace={onDeletePlace}
            routeLegs={routeLegs}
            segmentModes={segmentModes}
            onSegmentModeChange={onSegmentModeChange}
            segmentVisibility={segmentVisibility}
            onSegmentVisibilityChange={onSegmentVisibilityChange}
            onShowOnlySegment={onShowOnlySegment}
            onShowAllSegments={onShowAllSegments}
            onAddPlace={onAddPlace}
          />
        </>
      )}

      {sidebarTab === "checklist" && (
        <ChecklistPanel checklist={checklist} />
      )}
      {sidebarTab === "budget" && (
        <ExpensePanel
          expenses={expenses}
          members={members}
          currentUserId={currentUserId}
          tripStartDate={trip?.start_date}
          tripEndDate={trip?.end_date}
        />
      )}
    </aside>
  );
}
