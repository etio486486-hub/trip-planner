"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Shield, Trash2, Crown } from "lucide-react";
import {
  isAdminConfigured,
  isAdminSession,
  loginAdmin,
  logoutAdmin,
} from "@/lib/admin";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Trip } from "@/types/database";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [proUserId, setProUserId] = useState("");
  const [proMonths, setProMonths] = useState(1);
  const [proLoading, setProLoading] = useState(false);
  const [messageIsError, setMessageIsError] = useState(false);

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const validateProUserId = (raw: string): string | null => {
    const id = raw.trim();
    if (!id) return "Supabase Auth 사용자 UUID를 입력해 주세요.";
    if (id.startsWith("eyJ")) {
      return "service_role JWT 키가 아닙니다. Authentication → Users 의 사용자 ID(UUID)를 입력해 주세요.";
    }
    if (!UUID_RE.test(id)) {
      return "UUID 형식이 올바르지 않습니다. 예: 051b45f6-fa19-4c91-b0f0-7b4963d771d8";
    }
    return null;
  };

  useEffect(() => {
    setAuthed(isAdminSession());
  }, []);

  const loadTrips = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setTrips(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadTrips();
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminConfigured()) {
      setLoginError(
        ".env.local에 NEXT_PUBLIC_ADMIN_PASSWORD 를 설정해 주세요."
      );
      return;
    }
    if (loginAdmin(password)) {
      setAuthed(true);
      setAdminPassword(password);
      setLoginError(null);
      setPassword("");
    } else {
      setLoginError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleDelete = async (trip: Trip) => {
    if (
      !window.confirm(
        `「${trip.title}」 여행을 삭제할까요?\n일정·멤버·가계부 데이터가 모두 삭제됩니다.`
      )
    ) {
      return;
    }

    setDeletingId(trip.id);
    setMessage(null);

    const { error } = await getSupabase()
      .from("trips")
      .delete()
      .eq("id", trip.id);

    if (error) {
      setMessage(error.message);
    } else {
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
      setMessage(`「${trip.title}」 삭제됨`);
    }

    setDeletingId(null);
  };

  const handleProAction = async (action: "grant" | "revoke") => {
    const validationError = validateProUserId(proUserId);
    if (validationError) {
      setMessage(validationError);
      setMessageIsError(true);
      return;
    }

    setProLoading(true);
    setMessage(null);
    setMessageIsError(false);

    try {
      const res = await fetch("/api/admin/pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          userId: proUserId.trim(),
          action,
          months: proMonths,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        profile?: { is_pro: boolean; pro_until: string | null };
      };

      if (!res.ok) {
        setMessage(data.error ?? "Pro 설정 실패");
        setMessageIsError(true);
      } else if (action === "grant") {
        setMessage(
          `✓ Pro 부여 완료 · ${data.profile?.pro_until?.slice(0, 10) ?? ""}까지`
        );
        setMessageIsError(false);
      } else {
        setMessage("✓ Pro 해제 완료");
        setMessageIsError(false);
      }
    } catch {
      setMessage("네트워크 오류");
      setMessageIsError(true);
    }

    setProLoading(false);
  };

  if (!authed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg"
        >
          <div className="mb-4 flex justify-center">
            <Shield className="h-10 w-10 text-zinc-700" />
          </div>
          <h1 className="text-center text-xl font-bold text-zinc-900">
            관리자
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-600">
            여행 목록 조회 및 삭제
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            className="mt-5 w-full rounded-lg border border-zinc-300 px-3 py-2.5"
            autoFocus
          />
          {loginError && (
            <p className="mt-2 text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            로그인
          </button>
          <Link
            href="/"
            className="mt-4 block text-center text-xs text-zinc-500 hover:underline"
          >
            홈으로
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">관리자 · 여행 관리</h1>
            <p className="mt-1 text-sm text-zinc-600">
              등록된 모든 여행을 삭제할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              logoutAdmin();
              setAuthed(false);
              setAdminPassword("");
            }}
            className="text-sm text-zinc-500 hover:underline"
          >
            로그아웃
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              messageIsError
                ? "bg-red-50 text-red-800"
                : "bg-green-50 text-green-800"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-zinc-900">Pro 부여</h2>
          </div>
          <div className="mb-4 space-y-2 text-sm text-zinc-600">
            <p>
              <strong className="text-zinc-800">① Vercel 환경 변수</strong>{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              = Supabase API의 service_role <em>secret</em> (입력란에 넣지
              않음)
            </p>
            <p>
              <strong className="text-zinc-800">② 아래 입력란</strong> = Pro
              받을 <em>사용자 UUID</em> · Supabase Dashboard → Authentication →
              Users → 해당 사용자 ID 복사
            </p>
            <p className="text-xs text-zinc-500">
              예시 UUID:{" "}
              <code className="rounded bg-zinc-100 px-1">
                051b45f6-fa19-4c91-b0f0-7b4963d771d8
              </code>
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={proUserId}
              onChange={(e) => setProUserId(e.target.value)}
              placeholder="051b45f6-fa19-4c91-b0f0-7b4963d771d8"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 font-mono text-sm"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                기간
                <select
                  value={proMonths}
                  onChange={(e) => setProMonths(Number(e.target.value))}
                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                >
                  <option value={1}>1개월</option>
                  <option value={3}>3개월</option>
                  <option value={6}>6개월</option>
                  <option value={12}>12개월</option>
                </select>
              </label>
              <button
                type="button"
                disabled={proLoading}
                onClick={() => void handleProAction("grant")}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {proLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Pro 부여"
                )}
              </button>
              <button
                type="button"
                disabled={proLoading}
                onClick={() => void handleProAction("revoke")}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Pro 해제
              </button>
            </div>
          </div>
        </section>

        <h2 className="mb-3 text-base font-bold text-zinc-900">여행 목록</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : trips.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">여행이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900">{trip.title}</p>
                  <p className="text-xs text-zinc-500">
                    {trip.start_date} ~ {trip.end_date}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                    {trip.id}
                    {trip.invite_code && ` · 코드 ${trip.invite_code}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(trip)}
                  disabled={deletingId === trip.id}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === trip.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/"
          className="mt-8 block text-center text-sm text-zinc-500 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
