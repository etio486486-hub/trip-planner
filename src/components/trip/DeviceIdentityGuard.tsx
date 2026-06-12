"use client";

import { useEffect, useState } from "react";
import { syncDeviceIdentity } from "@/lib/user";

type DeviceIdentityGuardProps = {
  children: React.ReactNode;
};

/**
 * 1) Production URL로 리다이렉트 (Preview URL마다 storage가 달라 중복 가입 방지)
 * 2) 기기 ID를 cookie/localStorage에 고정
 */
export function DeviceIdentityGuard({ children }: DeviceIdentityGuardProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

    if (appUrl) {
      try {
        const target = new URL(appUrl);
        const onTripPage = window.location.pathname.startsWith("/trips/");

        if (onTripPage && window.location.host !== target.host) {
          window.location.replace(
            `${appUrl}${window.location.pathname}${window.location.search}`
          );
          return;
        }
      } catch {
        /* invalid NEXT_PUBLIC_APP_URL */
      }
    }

    syncDeviceIdentity();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-zinc-500">
        연결 중...
      </div>
    );
  }

  return <>{children}</>;
}
