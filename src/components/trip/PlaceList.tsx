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
import { GripVertical, Trash2 } from "lucide-react";
import { NearbyRestaurants } from "./NearbyRestaurants";
import { RouteSegmentInfo } from "./RouteSegmentInfo";
import type { RouteViewMode } from "@/lib/maps/segment-colors";
import type { Place } from "@/types/database";

type PlaceListProps = {
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onDelete: (placeId: string) => void;
  routeViewMode: RouteViewMode;
  onRouteViewModeChange: (mode: RouteViewMode) => void;
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
  onSelect: (id: string) => void;
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
        onClick={() => onSelect(place.id)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-medium text-zinc-800">
          {place.name}
        </p>
        {place.memo && (
          <p className="truncate text-xs text-zinc-400">{place.memo}</p>
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
  routeViewMode,
  onRouteViewModeChange,
}: PlaceListProps) {
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
          {places.map((place, index) => (
            <div key={place.id} className="flex flex-col gap-2">
              <SortablePlaceItem
                place={place}
                index={index}
                selected={selectedPlaceId === place.id}
                onSelect={onSelectPlace}
                onDelete={onDelete}
              />
              <NearbyRestaurants place={place} placeIndex={index} />
              {index < places.length - 1 && (
                <RouteSegmentInfo
                  from={place}
                  to={places[index + 1]}
                  fromIndex={index}
                  toIndex={index + 1}
                  routeViewMode={routeViewMode}
                  onRouteViewModeChange={onRouteViewModeChange}
                />
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
