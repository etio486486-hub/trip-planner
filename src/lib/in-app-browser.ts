type InAppBrowserInfo = {
  isInApp: boolean;
  name: string | null;
};

const IN_APP_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /KAKAOTALK/i, name: "카카오톡" },
  { pattern: /Instagram/i, name: "Instagram" },
  { pattern: /FBAN|FBAV/i, name: "Facebook" },
  { pattern: /Line\//i, name: "LINE" },
  { pattern: /NAVER/i, name: "네이버" },
  { pattern: /Twitter/i, name: "X(트위터)" },
  { pattern: /MicroMessenger/i, name: "WeChat" },
  { pattern: /Snapchat/i, name: "Snapchat" },
  { pattern: /LinkedInApp/i, name: "LinkedIn" },
  { pattern: /Slack/i, name: "Slack" },
  { pattern: /Discord/i, name: "Discord" },
  { pattern: /DaumApps/i, name: "다음" },
  { pattern: /Band/i, name: "밴드" },
];

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

/** Google OAuth가 차단되는 인앱 브라우저(webview) 여부 */
export function detectInAppBrowser(): InAppBrowserInfo {
  const ua = getUserAgent();

  for (const { pattern, name } of IN_APP_PATTERNS) {
    if (pattern.test(ua)) {
      return { isInApp: true, name };
    }
  }

  // Android WebView (Chrome 없이 wv 표시)
  if (/Android/i.test(ua) && /\bwv\b/.test(ua)) {
    return { isInApp: true, name: "앱 내 브라우저" };
  }

  // iOS: standalone Safari가 아니고 webkit만 있는 경우 (일부 webview)
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isSafari =
      /Safari/i.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|KAKAOTALK|Instagram|FBAN|Line\//i.test(ua);
    const isStandalone =
      typeof window !== "undefined" &&
      "standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone;

    if (!isSafari && !isStandalone && !/Chrome/i.test(ua)) {
      return { isInApp: true, name: "앱 내 브라우저" };
    }
  }

  return { isInApp: false, name: null };
}

export function isInAppBrowser(): boolean {
  return detectInAppBrowser().isInApp;
}

/** Android Chrome intent, iOS는 링크 복사 후 안내 */
export function openInExternalBrowser(url?: string): "opened" | "copied" | "failed" {
  const target = url ?? (typeof window !== "undefined" ? window.location.href : "");
  if (!target) return "failed";

  const ua = getUserAgent();

  // Android: Chrome으로 열기 시도
  if (/Android/i.test(ua)) {
    try {
      const stripped = target.replace(/^https?:\/\//, "");
      window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(target)};end`;
      return "opened";
    } catch {
      // fall through to copy
    }
  }

  // 범용: 클립보드 복사
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(target);
    return "copied";
  }

  return "failed";
}
