"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { ChecklistPanel } from "./ChecklistPanel";
import { CollapsibleSection } from "./CollapsibleSection";
import { DayTabs } from "./DayTabs";
import { ExpensePanel } from "./ExpensePanel";
import { TranslatorPanel } from "./TranslatorPanel";
import { TripHeader } from "./TripHeader";
import { InviteMembers } from "./InviteMembers";
import { MemberList } from "./MemberList";
import { PlaceList } from "./PlaceList";
import { PlaceSearch } from "./PlaceSearch";
import { AiRecommendPanel, type AiDay } from "@/components/pro/AiRecommendPanel";
import { resolveAiPlaces } from "@/lib/ai-place-resolve";
import type { SidebarTab } from "./TripMenuTabs";
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
  onAddPlaceToDay: (dayNumber: number, place: PlaceInput) => Promise<void>;
  onEnsureDaysUpTo: (dayNumber: number) => Promise<void>;
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
  checklist: ReturnType<typeof useTripChecklist>;
  expenses: ReturnType<typeof useTripExpenses>;
  isMobile?: boolean;
};

function ItineraryContent({
  trip,
  dailyPlans,
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
  onAddPlaceToDay,
  onEnsureDaysUpTo,
  onUpdatePlace,
  isMobile,
}: {
  trip: Trip | null;
  dailyPlans: DailyPlan[];
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
  onAddPlaceToDay: (dayNumber: number, place: PlaceInput) => Promise<void>;
  onEnsureDaysUpTo: (dayNumber: number) => Promise<void>;
  onUpdatePlace: (placeId: string, data: PlaceScheduleUpdate) => Promise<void>;
  isMobile?: boolean;
}) {
  const mapCenter = useMemo(() => {
    if (places.length === 0) {
      return { lat: 33.5904, lng: 130.4017 };
    }
    return {
      lat: places.reduce((s, p) => s + p.latitude, 0) / places.length,
      lng: places.reduce((s, p) => s + p.longitude, 0) / places.length,
    };
  }, [places]);

  const destinationLabel =
    trip?.title?.replace(/\s*여행!?\s*$/u, "").trim() || trip?.title || "여행지";

  const handleAddAiCourse = async (
    days: AiDay[],
    ctx: { destination: string; defaultLat: number; defaultLng: number }
  ) => {
    const maxDay = Math.max(...days.map((d) => d.dayNumber), 1);
    await onEnsureDaysUpTo(maxDay);

    const items = days.flatMap((day) =>
      day.places.map((p) => ({
        dayNumber: day.dayNumber,
        name: p.name,
        memo: p.memo,
      }))
    );

    const { resolved, skipped } = await resolveAiPlaces(
      items,
      ctx.destination,
      ctx.defaultLat,
      ctx.defaultLng
    );

    for (const { dayNumber, place } of resolved) {
      await onAddPlaceToDay(dayNumber, place);
    }

    return { added: resolved.length, skipped };
  };

  return (
    <>
      <AiRecommendPanel
        destination={destinationLabel}
        dayCount={Math.max(1, dailyPlans.length)}
        existingPlaceNames={places.map((p) => p.name)}
        defaultLat={mapCenter.lat}
        defaultLng={mapCenter.lng}
        onAddAiCourse={handleAddAiCourse}
        compact={isMobile}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 max-lg:pb-20">
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
              isMobile={isMobile}
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
  onAddPlaceToDay,
  onEnsureDaysUpTo,
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
        <TripHeader
          trip={trip}
          onUpdate={onUpdateTrip}
          compact
          rightActions={shareMenu}
        />

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

        {sidebarTab === "itinerary" && (
          <div className="sticky top-0 z-10 shrink-0 bg-white shadow-sm ring-1 ring-zinc-100">
            <DayTabs
              dailyPlans={dailyPlans}
              selectedDayNumber={selectedDayNumber}
              onSelectDay={onSelectDay}
              onAddDay={onAddDay}
              onRemoveDay={onRemoveDay}
              compact
            />
          </div>
        )}

        {sidebarTab === "itinerary" && (
          <ItineraryContent
            trip={trip}
            dailyPlans={dailyPlans}
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
            onAddPlaceToDay={onAddPlaceToDay}
            onEnsureDaysUpTo={onEnsureDaysUpTo}
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
        {sidebarTab === "translator" && <TranslatorPanel isMobile />}
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-zinc-200 bg-white lg:border-r">
      <TripHeader
        trip={trip}
        onUpdate={onUpdateTrip}
        rightActions={shareMenu}
      />

      <CollapsibleSection title="팀 · 초대" summary={teamSummary}>
        <InviteMembers tripId={tripId} inviteCode={trip?.invite_code} compact />
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
            trip={trip}
            dailyPlans={dailyPlans}
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
            onAddPlaceToDay={onAddPlaceToDay}
            onEnsureDaysUpTo={onEnsureDaysUpTo}
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
      {sidebarTab === "translator" && <TranslatorPanel />}
    </aside>
  );
}
