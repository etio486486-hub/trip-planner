const ADMIN_SESSION_KEY = "trip-planner-admin-session";

export function isAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function loginAdmin(password: string): boolean {
  const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
  if (!expected || password !== expected) return false;
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  } catch {
    return false;
  }
  return true;
}

export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ADMIN_PASSWORD);
}
