"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, Plus, Loader2 } from "lucide-react";
import {
  getSupabase,
  getSupabaseSetupMessage,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { getUserId } from "@/lib/user";
import type { Trip } from "@/types/database";

function formatSupabaseError(message: string): string {
  if (message.includes("Could not find the table")) {
    return "DB 테이블이 없습니다. Supabase SQL Editor에서 supabase/schema.sql을 실행해 주세요.";
  }
  if (message.includes("Invalid API key") || message.includes("401")) {
    return "Supabase API 키가 올바르지 않습니다. Publishable key(sb_publishable_...)를 .env.local에 넣었는지 확인하세요.";
  }
  return `오류: ${message}`;
}

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    getSupabase()
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(formatSupabaseError(fetchError.message));
        } else {
          setTrips(data ?? []);
        }
        setLoading(false);
      });
  }, [supabaseReady]);

  const createTrip = async () => {
    if (!supabaseReady) return;

    setCreating(true);
    setError(null);

    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 2);

    const { data, error: insertError } = await getSupabase()
      .from("trips")
      .insert({
        title: `새 여행 ${today.toLocaleDateString("ko-KR")}`,
        start_date: today.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        creator_id: getUserId(),
      })
      .select()
      .single();

    setCreating(false);

    if (insertError) {
      setError(formatSupabaseError(insertError.message));
      return;
    }

    if (data) {
      window.location.href = `/trips/${data.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-blue-600 p-3">
            <Map className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">여행 플래너</h1>
          <p className="mt-2 text-zinc-600">
            Google Maps + 실시간 공유로 함께 일정을 짜세요
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
            <p className="mt-4 text-center text-xs text-amber-700">
              .env.local 예시:
              <br />
              NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={createTrip}
              disabled={creating}
              className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              새 여행 만들기
            </button>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : trips.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                아직 여행이 없습니다. 위 버튼으로 시작하세요.
              </p>
            ) : (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-500">내 여행</h2>
                {trips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="font-semibold text-zinc-900">{trip.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {trip.start_date} ~ {trip.end_date}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
