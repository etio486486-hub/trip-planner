"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, Map } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  ensureTripMembership,
  getAuthDisplayName,
  isTripMemberOrCreator,
} from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeInviteCode } from "@/lib/invite-code";
import {
  grantTripAccess,
  hasTripAccess,
  touchJoinedTrip,
} from "@/lib/trip-access";
import { getUserId } from "@/lib/user";

type TripJoinGateProps = {
  tripId: string;
  children: React.ReactNode;
};

export function TripJoinGate({ tripId, children }: TripJoinGateProps) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const verify = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    const urlCode = normalizeInviteCode(
      new URLSearchParams(window.location.search).get("code") ?? ""
    );
    if (urlCode) grantTripAccess(tripId, urlCode);

    const { data, error: fetchError } = await getSupabase()
      .from("trips")
      .select("title, invite_code, creator_id")
      .eq("id", tripId)
      .single();

    if (fetchError || !data) {
      setError("여행을 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    setTripTitle(data.title);
    const code = data.invite_code ?? "";
    setInviteCode(code);

    const userId = getUserId();

    if (user) {
      const isMember = await isTripMemberOrCreator(
        tripId,
        user.id,
        data.creator_id
      );
      if (isMember) {
        if (code) grantTripAccess(tripId, code);
        touchJoinedTrip(tripId);
        setAllowed(true);
        setLoading(false);
        return;
      }

      if (urlCode && code && urlCode === normalizeInviteCode(code)) {
        await ensureTripMembership(
          tripId,
          user.id,
          getAuthDisplayName(user)
        );
        grantTripAccess(tripId, code);
        touchJoinedTrip(tripId);
        setAllowed(true);
        setLoading(false);
        return;
      }
    }

    if (
      hasTripAccess(tripId, code, data.creator_id, userId) ||
      (urlCode && code && urlCode === normalizeInviteCode(code))
    ) {
      if (code) grantTripAccess(tripId, code);
      else if (urlCode) grantTripAccess(tripId, urlCode);
      touchJoinedTrip(tripId);
      setAllowed(true);
    }

    setLoading(false);
  }, [tripId, user]);

  useEffect(() => {
    if (authLoading) return;
    verify();
  }, [verify, authLoading]);

  const handleJoin = async () => {
    const normalized = normalizeInviteCode(inputCode);
    if (!normalized) {
      setError("참여 코드를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getSupabase()
        .from("trips")
        .select("invite_code")
        .eq("id", tripId)
        .single();

      if (fetchError || !data?.invite_code) {
        setError("여행 정보를 확인할 수 없습니다.");
        return;
      }

      if (normalized !== normalizeInviteCode(data.invite_code)) {
        setError("참여 코드가 올바르지 않습니다.");
        return;
      }

      if (user) {
        await ensureTripMembership(
          tripId,
          user.id,
          getAuthDisplayName(user)
        );
      }

      grantTripAccess(tripId, data.invite_code);
      touchJoinedTrip(tripId);
      setAllowed(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-zinc-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        확인 중...
      </div>
    );
  }

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 safe-x safe-bottom">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex justify-center">
          <div className="rounded-xl bg-blue-600 p-3">
            <Map className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-center text-lg font-bold text-zinc-900">
          {tripTitle || "여행 참여"}
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Google 로그인 후 참여하거나 초대 코드를 입력하세요.
        </p>

        {!user && (
          <div className="mt-5">
            <GoogleSignInButton
              onSignIn={() => signInWithGoogle(`/trips/${tripId}`)}
              label="Google로 로그인하고 입장"
            />
          </div>
        )}

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs text-zinc-400">
            <span className="bg-white px-2">또는 참여 코드</span>
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600">
            <KeyRound className="h-3.5 w-3.5" />
            참여 코드
          </label>
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder={inviteCode ? "예: ABC123" : "6자리 코드"}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-center text-lg font-mono font-bold tracking-widest"
            autoFocus={Boolean(user)}
          />
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        )}

        <button
          type="button"
          onClick={handleJoin}
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "입장하기"
          )}
        </button>
      </div>
    </div>
  );
}
