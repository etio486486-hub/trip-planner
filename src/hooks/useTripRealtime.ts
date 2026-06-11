"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { getUserDisplayName, getUserId } from "@/lib/user";
import type {
  DailyPlan,
  Place,
  PlaceInput,
  PresenceUser,
  Trip,
  TripMember,
} from "@/types/database";

type UseTripRealtimeOptions = {
  tripId: string;
  selectedDayNumber: number;
};

function mergeDailyPlans(prev: DailyPlan[], incoming: DailyPlan[]): DailyPlan[] {
  const map = new Map(prev.map((plan) => [plan.id, plan]));
  incoming.forEach((plan) => map.set(plan.id, plan));
  return Array.from(map.values()).sort((a, b) => a.day_number - b.day_number);
}

type UseTripRealtimeReturn = {
  trip: Trip | null;
  dailyPlans: DailyPlan[];
  places: Place[];
  members: TripMember[];
  onlineUsers: PresenceUser[];
  loading: boolean;
  error: string | null;
  selectedDailyPlan: DailyPlan | null;
  addPlace: (input: PlaceInput) => Promise<void>;
  deletePlace: (placeId: string) => Promise<void>;
  reorderPlaces: (orderedIds: string[]) => Promise<void>;
  addDay: () => Promise<number>;
  removeDay: (dayNumber: number) => Promise<number>;
  updateTrip: (data: {
    title: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
};

export function useTripRealtime({
  tripId,
  selectedDayNumber,
}: UseTripRealtimeOptions): UseTripRealtimeReturn {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dailyPlanIdsRef = useRef<Set<string>>(new Set());
  const selectedDailyPlanIdRef = useRef<string | null>(null);

  const selectedDailyPlan =
    dailyPlans.find((p) => p.day_number === selectedDayNumber) ?? null;

  useEffect(() => {
    dailyPlanIdsRef.current = new Set(dailyPlans.map((p) => p.id));
  }, [dailyPlans]);

  useEffect(() => {
    selectedDailyPlanIdRef.current = selectedDailyPlan?.id ?? null;
  }, [selectedDailyPlan]);

  const loadPlacesForDay = useCallback(async (dailyPlanId: string) => {
    const { data, error: placesError } = await getSupabase()
      .from("places")
      .select("*")
      .eq("daily_plan_id", dailyPlanId)
      .order("visit_order", { ascending: true });

    if (placesError) throw placesError;
    setPlaces(data ?? []);
  }, []);

  const loadTripData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요."
      );
      setLoading(false);
      return;
    }

    try {
      const { data: tripData, error: tripError } = await getSupabase()
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      const userId = getUserId();
      const displayName = getUserDisplayName();

      await getSupabase()
        .from("trip_members")
        .upsert(
        {
          trip_id: tripId,
          user_id: userId,
          display_name: displayName,
        },
        { onConflict: "trip_id,user_id" }
      );

      const { data: membersData, error: membersError } = await getSupabase()
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId);

      if (membersError) throw membersError;
      setMembers(membersData ?? []);

      const { data: plansData, error: plansError } = await getSupabase()
        .from("daily_plans")
        .select("*")
        .eq("trip_id", tripId)
        .order("day_number", { ascending: true });

      if (plansError) throw plansError;

      let plans = plansData ?? [];

      if (plans.length === 0) {
        const { data: newPlan, error: createError } = await getSupabase()
          .from("daily_plans")
          .insert({ trip_id: tripId, day_number: 1 })
          .select()
          .single();

        if (createError) throw createError;
        plans = [newPlan];
      }

      setDailyPlans(mergeDailyPlans([], plans));

      const targetPlan =
        plans.find((p) => p.day_number === selectedDayNumber) ?? plans[0];
      if (targetPlan) {
        await loadPlacesForDay(targetPlan.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [tripId, selectedDayNumber, loadPlacesForDay]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  useEffect(() => {
    if (!selectedDailyPlan) return;
    loadPlacesForDay(selectedDailyPlan.id).catch((err) => {
      setError(err instanceof Error ? err.message : "장소 로드 실패");
    });
  }, [selectedDailyPlan, loadPlacesForDay]);

  // Realtime: places 테이블 변경 구독
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = getSupabase()
      .channel(`places:trip:${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        (payload) => {
          const dailyPlanId =
            payload.eventType === "DELETE"
              ? (payload.old as Place).daily_plan_id
              : (payload.new as Place).daily_plan_id;

          if (!dailyPlanIdsRef.current.has(dailyPlanId)) return;
          if (dailyPlanId !== selectedDailyPlanIdRef.current) return;

          if (payload.eventType === "INSERT") {
            const newPlace = payload.new as Place;
            setPlaces((prev) => {
              if (prev.some((p) => p.id === newPlace.id)) return prev;
              return [...prev, newPlace].sort(
                (a, b) => a.visit_order - b.visit_order
              );
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Place;
            setPlaces((prev) =>
              [...prev.map((p) => (p.id === updated.id ? updated : p))].sort(
                (a, b) => a.visit_order - b.visit_order
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Place;
            setPlaces((prev) => prev.filter((p) => p.id !== deleted.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_plans" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const plan = payload.new as DailyPlan;
            if (plan.trip_id !== tripId) return;
            setDailyPlans((prev) => mergeDailyPlans(prev, [plan]));
          } else if (payload.eventType === "UPDATE") {
            const plan = payload.new as DailyPlan;
            if (plan.trip_id !== tripId) return;
            setDailyPlans((prev) => mergeDailyPlans(prev, [plan]));
          } else if (payload.eventType === "DELETE") {
            const plan = payload.old as DailyPlan;
            if (plan.trip_id !== tripId) return;
            setDailyPlans((prev) => prev.filter((p) => p.id !== plan.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_members" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const member = payload.new as TripMember;
            if (member.trip_id !== tripId) return;
            setMembers((prev) => {
              if (prev.some((m) => m.id === member.id)) return prev;
              return [...prev, member];
            });
          } else if (payload.eventType === "DELETE") {
            const member = payload.old as TripMember;
            setMembers((prev) => prev.filter((m) => m.id !== member.id));
          }
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [tripId]);

  // Presence: 온라인 멤버
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const userId = getUserId();
    const displayName = getUserDisplayName();

    const channel = getSupabase().channel(`presence:trip:${tripId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => users.push(p));
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            display_name: displayName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [tripId]);

  const addPlace = useCallback(
    async (input: PlaceInput) => {
      if (!selectedDailyPlan) return;

      const nextOrder =
        places.length > 0
          ? Math.max(...places.map((p) => p.visit_order)) + 1
          : 1;

      const { error: insertError } = await getSupabase().from("places").insert({
        daily_plan_id: selectedDailyPlan.id,
        name: input.name,
        google_place_id: input.google_place_id ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
        visit_order: nextOrder,
        memo: input.memo ?? null,
      });

      if (insertError) throw insertError;
    },
    [selectedDailyPlan, places]
  );

  const deletePlace = useCallback(async (placeId: string) => {
    const { error: deleteError } = await getSupabase()
      .from("places")
      .delete()
      .eq("id", placeId);

    if (deleteError) throw deleteError;
  }, []);

  const reorderPlaces = useCallback(async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      visit_order: index + 1,
    }));

    setPlaces((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      return orderedIds
        .map((id, i) => {
          const place = map.get(id);
          return place ? { ...place, visit_order: i + 1 } : null;
        })
        .filter((p): p is Place => p !== null);
    });

    await Promise.all(
      updates.map(({ id, visit_order }) =>
        getSupabase().from("places").update({ visit_order }).eq("id", id)
      )
    );
  }, []);

  const addDay = useCallback(async (): Promise<number> => {
    const nextDay =
      dailyPlans.length > 0
        ? Math.max(...dailyPlans.map((p) => p.day_number)) + 1
        : 1;

    const { data, error: insertError } = await getSupabase()
      .from("daily_plans")
      .insert({ trip_id: tripId, day_number: nextDay })
      .select()
      .single();

    if (insertError) throw insertError;
    setDailyPlans((prev) => mergeDailyPlans(prev, [data]));
    return nextDay;
  }, [dailyPlans, tripId]);

  const removeDay = useCallback(
    async (dayNumber: number): Promise<number> => {
      if (dailyPlans.length <= 1) return dayNumber;

      const target = dailyPlans.find((p) => p.day_number === dayNumber);
      if (!target) return dayNumber;

      const { error: deleteError } = await getSupabase()
        .from("daily_plans")
        .delete()
        .eq("id", target.id);

      if (deleteError) throw deleteError;

      const remaining = dailyPlans
        .filter((p) => p.id !== target.id)
        .sort((a, b) => a.day_number - b.day_number);

      const renumbered: DailyPlan[] = [...remaining];

      for (let i = remaining.length - 1; i >= 0; i--) {
        const newDayNumber = i + 1;
        const plan = remaining[i];
        if (plan.day_number === newDayNumber) continue;

        const { data, error: updateError } = await getSupabase()
          .from("daily_plans")
          .update({ day_number: newDayNumber })
          .eq("id", plan.id)
          .select()
          .single();

        if (updateError) throw updateError;
        renumbered[i] = data;
      }

      setDailyPlans(mergeDailyPlans([], renumbered));
      if (target.id === selectedDailyPlanIdRef.current) {
        setPlaces([]);
      }

      if (dayNumber === selectedDayNumber) {
        return Math.min(dayNumber, renumbered.length);
      }
      if (dayNumber < selectedDayNumber) {
        return selectedDayNumber - 1;
      }
      return selectedDayNumber;
    },
    [dailyPlans, selectedDayNumber]
  );

  const updateTrip = useCallback(
    async (data: {
      title: string;
      start_date: string;
      end_date: string;
    }) => {
      const { data: updated, error: updateError } = await getSupabase()
        .from("trips")
        .update(data)
        .eq("id", tripId)
        .select()
        .single();

      if (updateError) throw updateError;
      setTrip(updated);
    },
    [tripId]
  );

  return {
    trip,
    dailyPlans,
    places,
    members,
    onlineUsers,
    loading,
    error,
    selectedDailyPlan,
    addPlace,
    deletePlace,
    reorderPlaces,
    addDay,
    removeDay,
    updateTrip,
  };
}
