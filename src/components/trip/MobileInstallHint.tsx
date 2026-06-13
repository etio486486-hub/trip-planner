"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useAppSettings } from "@/components/settings/SettingsProvider";

const DISMISS_KEY = "trip-planner-install-hint-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

export function MobileInstallHint() {
  const { settings } = useAppSettings();
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (!isMobileDevice() || isStandalone() || settings.hidePwaInstallHint) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    setVisible(true);
  }, [settings.hidePwaInstallHint]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[41] lg:hidden">
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-600 to-blue-600 p-3.5 text-white shadow-xl shadow-indigo-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">앱처럼 쓰기</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/90">
              {isIos ? (
                <>
                  Safari <Share className="mx-0.5 inline h-3 w-3" /> 공유 →{" "}
                  <strong>홈 화면에 추가</strong>하면 전체 화면으로 더 편해요.
                </>
              ) : (
                <>
                  Chrome 메뉴 → <strong>앱 설치</strong> 또는 홈 화면에
                  추가하면 오프라인에도 접근하기 쉬워요.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
