"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  bindUserToTrip,
  getDeviceMemberIdsForTrip,
  getUserDisplayName,
  getUserIdForTrip,
  hasCustomDisplayName,
  setUserDisplayName,
} from "@/lib/user";
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
  needsNameSetup: boolean;
  joinTripAsMember: (name: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  kickMember: (memberId: string) => Promise<void>;
  currentUserId: string;
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
  const [needsNameSetup, setNeedsNameSetup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  const dailyPlanIdsRef = useRef<Set<string>>(new Set());
  const tripUserIdRef = useRef("");
  const selectedDailyPlanIdRef = useRef<string | null>(null);
  const presenceChannelRef = useRef<ReturnType<
    ReturnType<typeof getSupabase>["channel"]
  > | null>(null);

  const selectedDailyPlan =
    dailyPlans.find((p) => p.day_number === selectedDayNumber) ?? null;

  useEffect(() => {
    dailyPlanIdsRef.current = new Set(dailyPlans.map((p) => p.id));
  }, [dailyPlans]);

  useEffect(() => {
    selectedDailyPlanIdRef.current = selectedDailyPlan?.id ?? null;
  }, [selectedDailyPlan]);

  const reconcileDeviceMembers = useCallback(
    async (activeUserId: string, creatorId: string, myName: string) => {
      const removeIds = new Set<string>();

      for (const oldId of getDeviceMemberIdsForTrip(tripId)) {
        if (oldId !== activeUserId) removeIds.add(oldId);
      }

      if (myName) {
        const { data: sameNameMembers } = await getSupabase()
          .from("trip_members")
          .select("user_id")
          .eq("trip_id", tripId)
          .eq("display_name", myName)
          .neq("user_id", activeUserId);

        for (const row of sameNameMembers ?? []) {
          if (row.user_id !== creatorId) {
            removeIds.add(row.user_id);
          }
        }
      }

      await Promise.all(
        [...removeIds].map((oldId) =>
          getSupabase()
            .from("trip_members")
            .delete()
            .eq("trip_id", tripId)
            .eq("user_id", oldId)
        )
      );

      bindUserToTrip(tripId, activeUserId);
    },
    [tripId]
  );

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

      const { data: membersData, error: membersError } = await getSupabase()
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId);

      if (membersError) throw membersError;

      const userId = getUserIdForTrip(tripId, membersData ?? []);
      tripUserIdRef.current = userId;
      setCurrentUserId(userId);

      const nameReady = hasCustomDisplayName();
      const displayName = getUserDisplayName();

      setNeedsNameSetup(!nameReady);

      if (nameReady) {
        await reconcileDeviceMembers(
          userId,
          tripData.creator_id,
          displayName
        );

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
      }

      const { data: refreshedMembers, error: refreshError } = await getSupabase()
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId);

      if (refreshError) throw refreshError;
      setMembers(refreshedMembers ?? []);

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
  }, [tripId, selectedDayNumber, loadPlacesForDay, reconcileDeviceMembers]);

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
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string }).id;
            if (!deletedId) return;
            setPlaces((prev) => prev.filter((p) => p.id !== deletedId));
            return;
          }

          const dailyPlanId = (payload.new as Place).daily_plan_id;

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
          } else if (payload.eventType === "UPDATE") {
            const member = payload.new as TripMember;
            if (member.trip_id !== tripId) return;
            setMembers((prev) =>
              prev.map((m) => (m.id === member.id ? member : m))
            );
          } else if (payload.eventType === "DELETE") {
            const member = payload.old as TripMember;
            if (member.trip_id !== tripId) return;
            if (member.user_id === tripUserIdRef.current) {
              window.location.href = "/";
              return;
            }
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

    const userId = tripUserIdRef.current || getUserIdForTrip(tripId);
    if (!userId) return;

    const channel = getSupabase().channel(`presence:trip:${tripId}`, {
      config: { presence: { key: userId } },
    });

    presenceChannelRef.current = channel;

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
        if (status === "SUBSCRIBED" && hasCustomDisplayName()) {
          await channel.track({
            user_id: userId,
            display_name: getUserDisplayName(),
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannelRef.current = null;
      getSupabase().removeChannel(channel);
    };
  }, [tripId, currentUserId]);

  const trackPresence = useCallback(async (displayName: string) => {
    const channel = presenceChannelRef.current;
    if (!channel) return;
    const userId = tripUserIdRef.current || getUserIdForTrip(tripId);
    await channel.track({
      user_id: userId,
      display_name: displayName,
      online_at: new Date().toISOString(),
    });
  }, [tripId]);

  const upsertMemberName = useCallback(
    async (name: string) => {
      const userId = getUserIdForTrip(tripId, members);
      tripUserIdRef.current = userId;
      setCurrentUserId(userId);
      setUserDisplayName(name);

      const creatorId = trip?.creator_id ?? "";
      await reconcileDeviceMembers(userId, creatorId, name);

      const { data, error: upsertError } = await getSupabase()
        .from("trip_members")
        .upsert(
          {
            trip_id: tripId,
            user_id: userId,
            display_name: name,
          },
          { onConflict: "trip_id,user_id" }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      setMembers((prev) => {
        const exists = prev.some((m) => m.user_id === userId);
        if (exists) {
          return prev.map((m) =>
            m.user_id === userId ? { ...m, display_name: name } : m
          );
        }
        return data ? [...prev, data] : prev;
      });

      setNeedsNameSetup(false);
      bindUserToTrip(tripId, userId);
      await trackPresence(name);

      const { data: refreshedMembers } = await getSupabase()
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId);
      if (refreshedMembers) setMembers(refreshedMembers);
    },
    [tripId, trip, members, trackPresence, reconcileDeviceMembers]
  );

  const joinTripAsMember = useCallback(
    async (name: string) => {
      await upsertMemberName(name);
    },
    [upsertMemberName]
  );

  const updateDisplayName = useCallback(
    async (name: string) => {
      await upsertMemberName(name);
    },
    [upsertMemberName]
  );

  const kickMember = useCallback(
    async (memberId: string) => {
      const me = tripUserIdRef.current || currentUserId;
      if (!trip || me !== trip.creator_id) {
        throw new Error("강퇴 권한이 없습니다.");
      }

      const target = members.find((m) => m.id === memberId);
      if (!target || target.user_id === trip.creator_id) {
        throw new Error("강퇴할 수 없는 멤버입니다.");
      }

      const { error: deleteError } = await getSupabase()
        .from("trip_members")
        .delete()
        .eq("id", memberId);

      if (deleteError) throw deleteError;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    },
    [trip, members, currentUserId]
  );

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

  const deletePlace = useCallback(
    async (placeId: string) => {
      const previous = places;
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));

      const { error: deleteError } = await getSupabase()
        .from("places")
        .delete()
        .eq("id", placeId);

      if (deleteError) {
        setPlaces(previous);
        throw deleteError;
      }
    },
    [places]
  );

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
    needsNameSetup,
    joinTripAsMember,
    updateDisplayName,
    kickMember,
    currentUserId,
  };
}
