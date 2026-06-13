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
  const path = sessionStorage.getItem(REDIRECT_KEY) ?? fallback;
  sessionStorage.removeItem(REDIRECT_KEY);
  return path;
}

export function hasOAuthParams(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  return url.searchParams.has("code") || url.searchParams.has("error");
}
