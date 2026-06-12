"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, KeyRound, Link2, Loader2, Map, Plus } from "lucide-react";
import {
  getSupabase,
  getSupabaseSetupMessage,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { generateInviteCode, normalizeInviteCode, parseTripJoinInput } from "@/lib/invite-code";
import {
  buildTripPath,
  getJoinedTrips,
  grantTripAccess,
  removeJoinedTrip,
  type JoinedTripRecord,
} from "@/lib/trip-access";
import { getUserId, syncDeviceIdentity } from "@/lib/user";
import { PopularPlacesPanel } from "@/components/home/PopularPlacesPanel";

type JoinedTripView = JoinedTripRecord & {
  title: string;
};

function formatSupabaseError(message: string): string {
  if (message.includes("Could not find the table")) {
    return "DB 테이블이 없습니다. Supabase SQL Editor에서 supabase/schema.sql을 실행해 주세요.";
  }
  if (message.includes("Invalid API key") || message.includes("401")) {
    return "Supabase API 키가 올바르지 않습니다.";
  }
  if (message.includes("invite_code")) {
    return "참여 코드 컬럼이 없습니다. supabase/migrations/20260612_trip_invite_code.sql 을 실행해 주세요.";
  }
  return `오류: ${message}`;
}

async function loadValidJoinedTrips(): Promise<JoinedTripView[]> {
  const joined = getJoinedTrips();
  if (joined.length === 0) return [];

  const ids = joined.map((trip) => trip.tripId);
  const { data, error } = await getSupabase()
    .from("trips")
    .select("id, title, invite_code")
    .in("id", ids);

  if (error || !data) return [];

  const valid: JoinedTripView[] = [];
  for (const record of joined) {
    const trip = data.find((row) => row.id === record.tripId);
    if (!trip?.invite_code) {
      removeJoinedTrip(record.tripId);
      continue;
    }
    if (normalizeInviteCode(trip.invite_code) !== normalizeInviteCode(record.code)) {
      removeJoinedTrip(record.tripId);
      continue;
    }
    valid.push({
      ...record,
      title: trip.title,
    });
  }
  return valid;
}

export default function Home() {
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [joinedTrips, setJoinedTrips] = useState<JoinedTripView[]>([]);
  const [checkingJoined, setCheckingJoined] = useState(true);

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) {
      setCheckingJoined(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const valid = await loadValidJoinedTrips();
      if (cancelled) return;

      if (valid.length === 1) {
        window.location.replace(buildTripPath(valid[0].tripId));
        return;
      }

      setJoinedTrips(valid);
      setCheckingJoined(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabaseReady]);

  const enterTrip = (trip: JoinedTripView) => {
    grantTripAccess(trip.tripId, trip.code);
    window.location.href = buildTripPath(trip.tripId);
  };

  const createTrip = async () => {
    if (!supabaseReady) return;

    syncDeviceIdentity();
    setCreating(true);
    setError(null);

    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 2);
    const inviteCode = generateInviteCode();

    const { data, error: insertError } = await getSupabase()
      .from("trips")
      .insert({
        title: `새 여행 ${today.toLocaleDateString("ko-KR")}`,
        start_date: today.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        creator_id: getUserId(),
        invite_code: inviteCode,
      })
      .select()
      .single();

    setCreating(false);

    if (insertError) {
      setError(formatSupabaseError(insertError.message));
      return;
    }

    if (data) {
      grantTripAccess(data.id, inviteCode);
      window.location.href = buildTripPath(data.id);
    }
  };

  const joinWithCode = async () => {
    const code = normalizeInviteCode(joinCode);
    if (!code) {
      setError("참여 코드를 입력해 주세요.");
      return;
    }

    setJoining(true);
    setError(null);

    const { data, error: fetchError } = await getSupabase()
      .from("trips")
      .select("id, invite_code")
      .eq("invite_code", code)
      .maybeSingle();

    setJoining(false);

    if (fetchError) {
      setError(formatSupabaseError(fetchError.message));
      return;
    }

    if (!data) {
      setError("일치하는 여행을 찾을 수 없습니다. 코드를 확인해 주세요.");
      return;
    }

    grantTripAccess(data.id, data.invite_code ?? code);
    window.location.href = buildTripPath(data.id);
  };

  const joinWithLink = async () => {
    const parsed = parseTripJoinInput(joinLink);
    if (!parsed.tripId && !parsed.code) {
      setError("올바른 초대 링크 또는 여행 ID를 붙여넣어 주세요.");
      return;
    }

    setJoining(true);
    setError(null);

    if (parsed.tripId) {
      const { data, error: fetchError } = await getSupabase()
        .from("trips")
        .select("id, invite_code")
        .eq("id", parsed.tripId)
        .maybeSingle();

      setJoining(false);

      if (fetchError || !data) {
        setError("여행을 찾을 수 없습니다.");
        return;
      }

      const code = parsed.code ?? data.invite_code;
      if (!code) {
        setError("참여 코드가 필요합니다. 링크에 ?code= 가 포함되어 있는지 확인해 주세요.");
        return;
      }

      if (normalizeInviteCode(code) !== normalizeInviteCode(data.invite_code ?? "")) {
        setError("참여 코드가 올바르지 않습니다.");
        return;
      }

      grantTripAccess(data.id, data.invite_code!);
      window.location.href = buildTripPath(data.id);
      return;
    }

    if (parsed.code) {
      const { data, error: fetchError } = await getSupabase()
        .from("trips")
        .select("id, invite_code")
        .eq("invite_code", parsed.code)
        .maybeSingle();

      setJoining(false);

      if (fetchError || !data) {
        setError("일치하는 여행을 찾을 수 없습니다.");
        return;
      }

      grantTripAccess(data.id, data.invite_code!);
      window.location.href = buildTripPath(data.id);
    }
  };

  if (checkingJoined && supabaseReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          참여 중인 여행 확인 중...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-blue-600 p-3">
            <Map className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">여행 플래너</h1>
          <p className="mt-2 text-zinc-600">
            {joinedTrips.length > 0
              ? "이전에 참여한 여행은 바로 입장할 수 있습니다"
              : "초대 링크·참여 코드로 여행에 참여할 수 있습니다"}
          </p>
        </div>

        {!supabaseReady ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-center font-medium text-amber-800">
              Supabase 연결 설정이 필요합니다
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-white/70 p-4 text-left text-xs leading-relaxed text-amber-900">
              {getSupabaseSetupMessage()}
            </pre>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {joinedTrips.length > 0 && (
              <div className="mb-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-zinc-800">
                  참여 중인 여행
                </h2>
                <ul className="space-y-2">
                  {joinedTrips.map((trip) => (
                    <li key={trip.tripId}>
                      <button
                        type="button"
                        onClick={() => enterTrip(trip)}
                        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="font-medium text-zinc-900">
                          {trip.title}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-blue-600">
                          바로 입장
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={createTrip}
              disabled={creating}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              새 여행 만들기
            </button>

            <PopularPlacesPanel />

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <KeyRound className="h-4 w-4 text-blue-600" />
                다른 여행 참여하기
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">
                    참여 코드 (6자리)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && joinWithCode()}
                      placeholder="ABC123"
                      className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2.5 text-center font-mono font-bold tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={joinWithCode}
                      disabled={joining}
                      className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      입장
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <div className="relative flex justify-center text-xs text-zinc-400">
                    <span className="bg-white px-2">또는</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600">
                    <Link2 className="h-3.5 w-3.5" />
                    초대 링크 붙여넣기
                  </label>
                  <input
                    type="text"
                    value={joinLink}
                    onChange={(e) => setJoinLink(e.target.value)}
                    placeholder="https://.../trips/...?code=..."
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={joinWithLink}
                    disabled={joining}
                    className="mt-2 w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {joining ? "확인 중..." : "링크로 입장"}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-zinc-500">
              <Link href="/admin" className="hover:underline">
                관리자
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
