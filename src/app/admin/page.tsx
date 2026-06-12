"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Shield, Trash2 } from "lucide-react";
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
            }}
            className="text-sm text-zinc-500 hover:underline"
          >
            로그아웃
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {message}
          </div>
        )}

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
