"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import { MapsProvider } from "./MapsProvider";
import { TripMap } from "./TripMap";
import { TripSidebar } from "./TripSidebar";

type TripPlannerClientProps = {
  tripId: string;
};

export function TripPlannerClient({ tripId }: TripPlannerClientProps) {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);

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
  } = useTripRealtime({ tripId, selectedDayNumber });

  const handleDeletePlace = async (id: string) => {
    try {
      await deletePlace(id);
    } catch (err) {
      console.error(err);
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

  return (
    <MapsProvider>
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
          />
          <main className="relative flex-1">
            <TripMap places={places} focusedPlaceId={focusedPlaceId} />
          </main>
        </div>
      </div>
    </MapsProvider>
  );
}
