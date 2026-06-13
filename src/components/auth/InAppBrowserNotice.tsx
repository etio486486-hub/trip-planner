"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react";
import {
  detectInAppBrowser,
  openInExternalBrowser,
} from "@/lib/in-app-browser";

type InAppBrowserNoticeProps = {
  className?: string;
};

export function InAppBrowserNotice({ className = "" }: InAppBrowserNoticeProps) {
  const [appName, setAppName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAppName(detectInAppBrowser().name);
  }, []);

  const handleOpenExternal = () => {
    const result = openInExternalBrowser();
    if (result === "copied") {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 p-4 text-left ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            {appName ? `${appName}에서는` : "이 앱에서는"} Google 로그인이
            차단됩니다
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-800">
            Google 정책상 카카오톡·인스타 등 <strong>앱 안 브라우저</strong>
            에서는 로그인할 수 없어요.{" "}
            <strong>Safari</strong> 또는 <strong>Chrome</strong>에서 열어
            주세요.
          </p>

          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={handleOpenExternal}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              <ExternalLink className="h-4 w-4" />
              Safari / Chrome에서 열기
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-100/50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  링크 복사됨 · 브라우저에 붙여넣기
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  링크 복사하기
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-amber-700/90">
            카카오톡: 우측 상단 <strong>⋮</strong> 또는 <strong>···</strong>{" "}
            → &quot;Safari/Chrome에서 열기&quot; 선택
          </p>
        </div>
      </div>
    </div>
  );
}
