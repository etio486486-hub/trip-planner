const USER_ID_KEY = "trip-planner-user-id";
const USER_NAME_KEY = "trip-planner-user-name";
const USER_NAME_SET_KEY = "trip-planner-name-customized";

function generateId(): string {
  return crypto.randomUUID();
}

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function hasCustomDisplayName(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(USER_NAME_SET_KEY) === "true";
}

export function getUserDisplayName(): string {
  if (typeof window === "undefined") return "익명";
  return localStorage.getItem(USER_NAME_KEY) ?? "";
}

export function setUserDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (!trimmed) return;
  localStorage.setItem(USER_NAME_KEY, trimmed);
  localStorage.setItem(USER_NAME_SET_KEY, "true");
}
