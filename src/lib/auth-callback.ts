const REDIRECT_KEY = "trip-planner-auth-redirect";
const REDIRECT_COOKIE = "tp-auth-next";

export function storeAuthRedirect(path: string): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(REDIRECT_KEY, path);

  const secure = window.location.protocol === "https:";
  document.cookie = `${REDIRECT_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=600; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function consumeAuthRedirect(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;

  let path = sessionStorage.getItem(REDIRECT_KEY);

  if (!path) {
    const match = document.cookie.match(/(?:^|;\s*)tp-auth-next=([^;]*)/);
    if (match?.[1]) {
      try {
        path = decodeURIComponent(match[1]);
      } catch {
        path = match[1];
      }
    }
  }

  sessionStorage.removeItem(REDIRECT_KEY);

  const secure = window.location.protocol === "https:";
  document.cookie = `${REDIRECT_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure ? "; Secure" : ""}`;

  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return fallback;
}

export function hasOAuthParams(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  return url.searchParams.has("code") || url.searchParams.has("error");
}
