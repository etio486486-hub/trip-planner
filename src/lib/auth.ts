import type { User } from "@supabase/supabase-js";
import { storeAuthRedirect } from "@/lib/auth-callback";
import { setCachedAuthUserId } from "@/lib/auth-cache";
import { getSupabase } from "@/lib/supabase/client";
import { grantTripAccess } from "@/lib/trip-access";
import { getDeviceMemberIdsForTrip, getTripBoundUserId, setUserDisplayName, hasCustomDisplayName } from "@/lib/user";

export { getCachedAuthUserId, setCachedAuthUserId } from "@/lib/auth-cache";

export function getAuthDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  return (
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    "여행자"
  );
}

export function applyGoogleProfile(user: User): void {
  if (hasCustomDisplayName()) return;
  const name = getAuthDisplayName(user);
  if (name) setUserDisplayName(name);
}

export async function signInWithGoogle(redirectPath = "/"): Promise<void> {
  // 반드시 현재 접속 origin 사용 (Vercel preview·도메인 불일치 시 PKCE 실패 방지)
  const origin = window.location.origin;

  storeAuthRedirect(redirectPath);

  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
      },
    },
  });

  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
  setCachedAuthUserId(null);
}

export async function getAuthSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export type UserTripSummary = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  role: "creator" | "member";
};

export async function loadUserTrips(userId: string): Promise<UserTripSummary[]> {
  const supabase = getSupabase();

  const [createdRes, joinedRes] = await Promise.all([
    supabase
      .from("trips")
      .select("id, title, start_date, end_date")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("trip_members")
      .select("trip_id, trips(id, title, start_date, end_date)")
      .eq("user_id", userId),
  ]);

  const map = new Map<string, UserTripSummary>();

  for (const trip of createdRes.data ?? []) {
    map.set(trip.id, { ...trip, role: "creator" });
  }

  for (const row of joinedRes.data ?? []) {
    const raw = row.trips;
    const trip = Array.isArray(raw) ? raw[0] : raw;
    if (
      !trip ||
      typeof trip !== "object" ||
      !("id" in trip) ||
      map.has(trip.id as string)
    ) {
      continue;
    }
    map.set(trip.id as string, {
      id: trip.id as string,
      title: trip.title as string,
      start_date: trip.start_date as string,
      end_date: trip.end_date as string,
      role: "member",
    });
  }

  return [...map.values()];
}

export async function joinTripWithCode(
  userId: string,
  code: string,
  displayName: string
): Promise<{ tripId: string } | { error: string }> {
  const normalized = code.trim().toUpperCase();
  const { data: trip, error } = await getSupabase()
    .from("trips")
    .select("id, invite_code")
    .eq("invite_code", normalized)
    .maybeSingle();

  if (error || !trip?.invite_code) {
    return { error: "일치하는 여행을 찾을 수 없습니다." };
  }

  await getSupabase()
    .from("trip_members")
    .upsert(
      {
        trip_id: trip.id,
        user_id: userId,
        display_name: displayName,
      },
      { onConflict: "trip_id,user_id" }
    );

  grantTripAccess(trip.id, trip.invite_code);
  return { tripId: trip.id };
}

export async function isTripMemberOrCreator(
  tripId: string,
  userId: string,
  creatorId: string
): Promise<boolean> {
  if (creatorId === userId) return true;

  const { data } = await getSupabase()
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function ensureTripMembership(
  tripId: string,
  userId: string,
  displayName: string
): Promise<void> {
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

/** 이 기기에서 쓰던 익명 ID가 방장이면 Google 계정으로 방장 권한 이전 */
export async function migrateCreatorToAuthUser(
  tripId: string,
  authUserId: string,
  currentCreatorId: string
): Promise<boolean> {
  if (currentCreatorId === authUserId) return false;

  const deviceIds = getDeviceMemberIdsForTrip(tripId);
  const boundId = getTripBoundUserId(tripId);
  const ownedOnThisDevice =
    deviceIds.includes(currentCreatorId) ||
    boundId === currentCreatorId;

  if (!ownedOnThisDevice) return false;

  const { error } = await getSupabase()
    .from("trips")
    .update({ creator_id: authUserId })
    .eq("id", tripId);

  return !error;
}
