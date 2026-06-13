"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { consumeAuthRedirect } from "@/lib/auth-callback";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      if (!isSupabaseConfigured()) {
        router.replace("/?auth_error=supabase");
        return;
      }

      const oauthError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      if (oauthError) {
        router.replace(
          `/?auth_error=${encodeURIComponent(errorDescription ?? oauthError)}`
        );
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        router.replace("/?auth_error=missing_code");
        return;
      }

      setMessage("Google 계정 연결 중...");

      const supabase = getSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (cancelled) return;

      if (error) {
        router.replace(`/?auth_error=${encodeURIComponent(error.message)}`);
        return;
      }

      const nextPath = consumeAuthRedirect("/");
      router.replace(nextPath);
    };

    void finish();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fb] px-4">
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
        <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fb]">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
