"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Google 로그인 처리 중...");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace("/?auth_error=supabase");
      return;
    }

    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/";

    if (!code) {
      router.replace("/?auth_error=missing_code");
      return;
    }

    (async () => {
      const { error } = await getSupabase().auth.exchangeCodeForSession(code);
      if (error) {
        setMessage("로그인에 실패했습니다. 다시 시도해 주세요.");
        setTimeout(() => router.replace("/?auth_error=1"), 1500);
        return;
      }
      router.replace(next);
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        {message}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
          로그인 처리 중...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
