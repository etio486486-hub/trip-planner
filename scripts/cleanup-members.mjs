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
const KEEP_NAME = "김현우";
const TRIP_ID = process.argv[2] || "84ba43fd-d96d-493f-9240-ffcb0e0c93d2";

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const listRes = await fetch(
  `${BASE}/rest/v1/trip_members?trip_id=eq.${TRIP_ID}&select=*`,
  { headers }
);
const members = await listRes.json();

if (!listRes.ok) {
  console.error("조회 실패:", members);
  process.exit(1);
}

console.log(`trip ${TRIP_ID} 멤버 ${members.length}명:`);
members.forEach((m) => console.log(` - ${m.display_name} (${m.id})`));

const keep = members.filter((m) => m.display_name === KEEP_NAME);
const remove = members.filter((m) => m.display_name !== KEEP_NAME);

if (keep.length === 0) {
  console.error(`"${KEEP_NAME}" 멤버를 찾을 수 없습니다.`);
  process.exit(1);
}

if (remove.length === 0) {
  console.log("삭제할 멤버가 없습니다.");
  process.exit(0);
}

const ids = remove.map((m) => m.id).join(",");
const delRes = await fetch(
  `${BASE}/rest/v1/trip_members?id=in.(${ids})`,
  { method: "DELETE", headers: { ...headers, Prefer: "return=minimal" } }
);

if (!delRes.ok) {
  const err = await delRes.text();
  console.error("삭제 실패:", err);
  process.exit(1);
}

console.log(`\n${remove.length}명 삭제 완료. "${KEEP_NAME}"만 남았습니다.`);
