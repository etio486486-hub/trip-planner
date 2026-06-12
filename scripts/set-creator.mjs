import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TRIP_ID = process.argv[2] || "84ba43fd-d96d-493f-9240-ffcb0e0c93d2";
const CREATOR_NAME = process.argv[3] || "김현우";

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const membersRes = await fetch(
  `${BASE}/rest/v1/trip_members?trip_id=eq.${TRIP_ID}&select=*`,
  { headers }
);
const members = await membersRes.json();

if (!membersRes.ok) {
  console.error("멤버 조회 실패:", members);
  process.exit(1);
}

console.log("현재 멤버:");
members.forEach((m) => console.log(` - ${m.display_name} (${m.user_id})`));

const target = members.find((m) => m.display_name === CREATOR_NAME);
if (!target) {
  console.error(`"${CREATOR_NAME}" 멤버를 찾을 수 없습니다.`);
  process.exit(1);
}

const updateRes = await fetch(`${BASE}/rest/v1/trips?id=eq.${TRIP_ID}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ creator_id: target.user_id }),
});

const updated = await updateRes.json();
if (!updateRes.ok) {
  console.error("방장 변경 실패:", updated);
  process.exit(1);
}

console.log(`\n완료: "${CREATOR_NAME}" 님이 방장이 되었습니다.`);
console.log(`creator_id = ${target.user_id}`);
