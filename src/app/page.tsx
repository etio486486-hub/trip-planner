"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { HomeLayout } from "@/components/home/HomeLayout";
import {
  getAuthDisplayName,
  joinTripWithCode,
  loadUserTrips,
  type UserTripSummary,
} from "@/lib/auth";
import {
  getSupabase,
  getSupabaseSetupMessage,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { generateInviteCode, normalizeInviteCode } from "@/lib/invite-code";
import { buildTripPath, grantTripAccess } from "@/lib/trip-access";
import { usePro } from "@/hooks/usePro";
import { ProBadge } from "@/components/pro/ProBadge";
import { ProUpgradePanel } from "@/components/pro/ProUpgradePanel";
import { formatProUntil } from "@/lib/pro";
import { FREE_TRIP_LIMIT } from "@/lib/pro-features";

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

function HomeContent() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const searchParams = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [myTrips, setMyTrips] = useState<UserTripSummary[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);

  const supabaseReady = isSupabaseConfigured();
  const authError = searchParams.get("auth_error");
  const { isPro, profile: proProfile, preview: proPreview, hasFeature } = usePro();

  const createdTripCount = myTrips.filter((t) => t.role === "creator").length;
  const atTripLimit =
    !hasFeature("unlimited_trips") && createdTripCount >= FREE_TRIP_LIMIT;

  useEffect(() => {
    if (authError) {
      const messages: Record<string, string> = {
        missing_code:
          "로그인 코드가 전달되지 않았습니다. Safari/Chrome에서 다시 시도해 주세요.",
        supabase: "Supabase 연결 설정을 확인해 주세요.",
      };
      setError(
        messages[authError] ??
          decodeURIComponent(authError).replace(/\+/g, " ")
      );
    }
  }, [authError]);

  useEffect(() => {
    if (!user || !supabaseReady) {
      setMyTrips([]);
      return;
    }

    let cancelled = false;
    setLoadingTrips(true);

    loadUserTrips(user.id)
      .then((trips) => {
        if (cancelled) return;
        setMyTrips(trips);
        if (trips.length === 1) {
          window.location.replace(buildTripPath(trips[0].id));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTrips(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, supabaseReady]);

  const createTrip = async () => {
    if (!supabaseReady || !user) return;

    if (atTripLimit) {
      setError(
        `무료 계정은 여행 ${FREE_TRIP_LIMIT}개까지 만들 수 있습니다. Pro로 업그레이드하세요.`
      );
      return;
    }

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
        creator_id: user.id,
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
    if (!user) {
      setError("Google 로그인 후 참여할 수 있습니다.");
      return;
    }

    const code = normalizeInviteCode(joinCode);
    if (!code) {
      setError("참여 코드를 입력해 주세요.");
      return;
    }

    setJoining(true);
    setError(null);

    const result = await joinTripWithCode(
      user.id,
      code,
      getAuthDisplayName(user)
    );

    setJoining(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    window.location.href = buildTripPath(result.tripId);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb]">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <HomeLayout>
      <div className="safe-x">
        <div className="mb-7 border-b border-zinc-100 pb-6 text-left">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            시작하기
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Google로 로그인하고 여행을 만들어 보세요
          </p>
        </div>

        {!supabaseReady ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-center text-sm font-medium text-amber-800">
              Supabase 연결 설정이 필요합니다
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-left text-xs leading-relaxed text-amber-900">
              {getSupabaseSetupMessage()}
            </pre>
          </div>
        ) : !user ? (
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <GoogleSignInButton onSignIn={() => signInWithGoogle("/")} />
            <p className="text-left text-xs leading-relaxed text-zinc-500">
              로그인하면 내 여행이 자동으로 저장됩니다.
              초대 링크를 받았다면 로그인 후 바로 입장할 수 있어요.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-zinc-900">
                  {getAuthDisplayName(user)}
                  {isPro && <ProBadge size="sm" />}
                </p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
                {isPro && (
                  <p className="mt-0.5 text-[11px] font-medium text-green-700">
                    Pro 활성
                    {formatProUntil(proProfile?.pro_until ?? null)
                      ? ` · ${formatProUntil(proProfile?.pro_until ?? null)}까지`
                      : ""}
                    {proPreview ? " (미리보기)" : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                로그아웃
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {loadingTrips ? (
              <div className="mb-5 flex items-center justify-center py-6 text-sm text-zinc-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                내 여행 불러오는 중...
              </div>
            ) : myTrips.length > 1 ? (
              <div className="mb-5">
                <h2 className="mb-2 text-sm font-semibold text-zinc-800">
                  내 여행
                </h2>
                <ul className="space-y-2">
                  {myTrips.map((trip) => (
                    <li key={trip.id}>
                      <a
                        href={buildTripPath(trip.id)}
                        className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                      >
                        <div>
                          <p className="font-medium text-zinc-900">
                            {trip.title}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {trip.role === "creator" ? "만든 여행" : "참여 중"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="button"
              onClick={createTrip}
              disabled={creating || atTripLimit}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              새 여행 만들기
            </button>

            {atTripLimit && (
              <div className="mb-4">
                <p className="mb-2 text-center text-xs text-zinc-500">
                  만든 여행 {createdTripCount}/{FREE_TRIP_LIMIT} · Pro는 무제한
                </p>
                <ProUpgradePanel featureId="unlimited_trips" compact />
              </div>
            )}

            {!atTripLimit && createdTripCount > 0 && !hasFeature("unlimited_trips") && (
              <p className="mb-4 text-center text-[11px] text-zinc-400">
                만든 여행 {createdTripCount}/{FREE_TRIP_LIMIT}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowJoinCode((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <KeyRound className="h-4 w-4" />
              {showJoinCode ? "참여 코드 닫기" : "참여 코드로 입장"}
            </button>

            {showJoinCode && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
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
                  {joining ? "..." : "입장"}
                </button>
              </div>
            )}
          </>
        )}

        <p className="mt-8 border-t border-zinc-100 pt-5 text-center text-xs text-zinc-400">
          <Link href="/admin" className="hover:text-zinc-600 hover:underline">
            관리자
          </Link>
        </p>
      </div>
    </HomeLayout>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb]">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
