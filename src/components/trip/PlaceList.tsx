"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical, Trash2 } from "lucide-react";
import { PlaceScheduleEditor } from "./PlaceScheduleEditor";
import { PlaceTimeline } from "./PlaceTimeline";
import {
  getSegmentMode,
  isSegmentVisible,
  type SegmentLegState,
} from "@/hooks/useTripRouteLegs";
import type { RouteViewMode } from "@/lib/maps/segment-colors";
import { NearbyRestaurants } from "./NearbyRestaurants";
import { RouteSegmentInfo } from "./RouteSegmentInfo";
import type { Place, PlaceScheduleUpdate } from "@/types/database";

type PlaceListProps = {
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  onReorder: (orderedIds: string[]) => void;
  onDelete: (placeId: string) => void;
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
  onUpdatePlace: (placeId: string, data: PlaceScheduleUpdate) => Promise<void>;
};

function SortablePlaceItem({
  place,
  index,
  selected,
  onSelect,
  onDelete,
}: {
  place: Place;
  index: number;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-3 shadow-sm transition-colors ${
        selected
          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
          : "border-zinc-200 bg-white"
      }`}
    >
      <button
        type="button"
        className="cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          selected
            ? "bg-blue-600 text-white"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {index + 1}
      </span>
      <button
        type="button"
        onClick={() => onSelect(selected ? null : place.id)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-medium text-zinc-800">
          {place.name}
        </p>
        {(place.visit_time || place.memo) && (
          <p className="truncate text-xs text-zinc-400">
            {place.visit_time && (
              <span className="inline-flex items-center gap-0.5 text-blue-600">
                <Clock className="h-3 w-3" />
                {place.visit_time}
                {place.duration_minutes
                  ? ` · ${place.duration_minutes}분`
                  : ""}
              </span>
            )}
            {place.visit_time && place.memo ? " · " : ""}
            {place.memo}
          </p>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(place.id);
        }}
        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500"
        aria-label={`${place.name} 삭제`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PlaceList({
  places,
  selectedPlaceId,
  onSelectPlace,
  onReorder,
  onDelete,
  routeLegs,
  segmentModes,
  onSegmentModeChange,
  segmentVisibility,
  onSegmentVisibilityChange,
  onShowOnlySegment,
  onShowAllSegments,
  onUpdatePlace,
}: PlaceListProps) {
  const hasHiddenSegment =
    routeLegs.length > 0 &&
    routeLegs.some(
      (leg) =>
        !isSegmentVisible(segmentVisibility, leg.fromId, leg.toId)
    );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = places.findIndex((p) => p.id === active.id);
    const newIndex = places.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...places];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map((p) => p.id));
  };

  if (places.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-400">
        아직 등록된 장소가 없습니다.
        <br />
        아래 버튼으로 장소를 추가해 보세요.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={places.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 p-3">
          <PlaceTimeline places={places} />
          {hasHiddenSegment && (
            <button
              type="button"
              onClick={onShowAllSegments}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100"
            >
              전체 경로 표시 (숨긴 구간 모두 보이기)
            </button>
          )}
          {places.map((place, index) => (
            <div key={place.id} className="flex flex-col gap-2">
              <SortablePlaceItem
                place={place}
                index={index}
                selected={selectedPlaceId === place.id}
                onSelect={onSelectPlace}
                onDelete={onDelete}
              />
              {selectedPlaceId === place.id && (
                <PlaceScheduleEditor
                  place={place}
                  onSave={onUpdatePlace}
                />
              )}
              <NearbyRestaurants place={place} placeIndex={index} />
              {index < places.length - 1 && routeLegs[index] && (
                <RouteSegmentInfo
                  key={`${routeLegs[index].fromId}-${routeLegs[index].toId}`}
                  leg={routeLegs[index]}
                  fromIndex={index}
                  toIndex={index + 1}
                  segmentMode={getSegmentMode(
                    segmentModes,
                    routeLegs[index].fromId,
                    routeLegs[index].toId
                  )}
                  onSegmentModeChange={(mode) =>
                    onSegmentModeChange(
                      routeLegs[index].fromId,
                      routeLegs[index].toId,
                      mode
                    )
                  }
                  segmentVisible={isSegmentVisible(
                    segmentVisibility,
                    routeLegs[index].fromId,
                    routeLegs[index].toId
                  )}
                  onSegmentVisibilityChange={(visible) =>
                    onSegmentVisibilityChange(
                      routeLegs[index].fromId,
                      routeLegs[index].toId,
                      visible
                    )
                  }
                  onShowOnlySegment={() =>
                    onShowOnlySegment(
                      routeLegs[index].fromId,
                      routeLegs[index].toId
                    )
                  }
                />
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
