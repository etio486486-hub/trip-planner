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
import type {
  DailyPlan,
  Place,
  PlaceScheduleUpdate,
  PresenceUser,
  Trip,
  TripMember,
  PlaceInput,
} from "@/types/database";
import { TripShareMenu } from "./TripShareMenu";

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
  onUpdatePlace: (placeId: string, data: PlaceScheduleUpdate) => Promise<void>;
  onReorderPlaces: (ids: string[]) => void;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
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
  onUpdatePlace,
  isMobile,
}: {
  loading: boolean;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
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
  onUpdatePlace: (placeId: string, data: PlaceScheduleUpdate) => Promise<void>;
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
              onUpdatePlace={onUpdatePlace}
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
  onUpdatePlace,
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

  const shareMenu = (
    <TripShareMenu
      trip={trip}
      tripId={tripId}
      dailyPlans={dailyPlans}
      selectedDayNumber={selectedDayNumber}
      places={places}
      members={members}
      expenses={expenses}
      checklist={checklist}
      compact={isMobile}
    />
  );

  if (isMobile) {
    return (
      <aside className="flex h-full w-full min-w-0 flex-col bg-white">
        <div className="relative shrink-0">
          <TripHeader trip={trip} onUpdate={onUpdateTrip} compact />
          <div className="absolute right-2 top-2">{shareMenu}</div>
        </div>

        <CollapsibleSection title="팀 · 초대" summary={teamSummary}>
          <InviteMembers
            tripId={tripId}
            inviteCode={trip?.invite_code}
            compact
          />
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
            onUpdatePlace={onUpdatePlace}
            isMobile
          />
        )}

        {sidebarTab === "checklist" && (
          <ChecklistPanel
            checklist={checklist}
            members={members}
            isMobile
          />
        )}
        {sidebarTab === "budget" && (
          <ExpensePanel
            tripId={tripId}
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
      <div className="relative shrink-0">
        <TripHeader trip={trip} onUpdate={onUpdateTrip} />
        <div className="absolute right-3 top-3">{shareMenu}</div>
      </div>

      <InviteMembers tripId={tripId} inviteCode={trip?.invite_code} />
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
            onUpdatePlace={onUpdatePlace}
          />
        </>
      )}

      {sidebarTab === "checklist" && (
        <ChecklistPanel checklist={checklist} members={members} />
      )}
      {sidebarTab === "budget" && (
        <ExpensePanel
          tripId={tripId}
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
