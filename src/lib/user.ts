const USER_ID_KEY = "trip-planner-user-id";
const USER_NAME_KEY = "trip-planner-user-name";

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

export function getUserDisplayName(): string {
  if (typeof window === "undefined") return "익명";
  let name = localStorage.getItem(USER_NAME_KEY);
  if (!name) {
    name = `여행자${Math.floor(Math.random() * 9000) + 1000}`;
    localStorage.setItem(USER_NAME_KEY, name);
  }
  return name;
}
