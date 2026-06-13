import { COMMON_PHRASES } from "@/lib/common-phrases";
import { buildItineraryShareText, fetchAllPlacesByDay } from "@/lib/trip-share";
import type { DailyPlan, Place, Trip } from "@/types/database";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function downloadOfflinePack(options: {
  trip: Trip;
  dailyPlans: DailyPlan[];
  tripId: string;
  maxDayNumber?: number;
  watermark?: boolean;
}): Promise<void> {
  const { trip, dailyPlans, tripId, maxDayNumber, watermark } = options;

  const allMap = await fetchAllPlacesByDay(tripId, dailyPlans);
  const filteredPlans = maxDayNumber
    ? dailyPlans.filter((p) => p.day_number <= maxDayNumber)
    : dailyPlans;

  const filteredMap = new Map<number, Place[]>();
  for (const plan of filteredPlans) {
    const places = allMap.get(plan.day_number);
    if (places) filteredMap.set(plan.day_number, places);
  }

  const itineraryText = buildItineraryShareText(trip, filteredPlans, filteredMap);

  const phraseRows = COMMON_PHRASES.map(
    (p) =>
      `<tr><td>${escapeHtml(p.ko)}</td><td>${escapeHtml(p.ja)}</td><td>${escapeHtml(p.jaReading)}</td></tr>`
  ).join("");

  const coords = [...filteredMap.entries()]
    .flatMap(([day, dayPlaces]) =>
      dayPlaces.map(
        (p, i) =>
          `<li><strong>Day ${day} · ${i + 1}. ${escapeHtml(p.name)}</strong><br/><span class="muted">${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}</span></li>`
      )
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(trip.title)} — 오프라인 팩</title>
  <style>
    *{box-sizing:border-box} body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#f6f8fc;color:#18181b;line-height:1.6}
    h1{font-size:1.35rem;margin:0 0 8px;background:linear-gradient(135deg,#2563eb,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .banner{background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;padding:12px 16px;border-radius:12px;margin-bottom:16px;font-size:13px}
    .card{background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 4px 24px -8px rgba(15,23,42,.12)}
    pre{white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{border-bottom:1px solid #e4e4e7;padding:8px 4px;text-align:left}
    th{color:#71717a;font-size:11px}
    ul{padding-left:18px;margin:0}
    .muted{color:#71717a;font-size:12px}
    .wm{text-align:center;font-size:11px;color:#a1a1aa;margin-top:24px}
  </style>
</head>
<body>
  ${watermark ? '<div class="banner">Trip Planner · 무료 미리보기 (1일치) · Pro는 전체 일정+통역문장</div>' : '<div class="banner">✈️ 오프라인 팩 — Wi-Fi 없이도 열어보세요</div>'}
  <h1>${escapeHtml(trip.title)}</h1>
  <p class="muted">${escapeHtml(trip.start_date)} ~ ${escapeHtml(trip.end_date)}</p>

  <div class="card">
    <h2>📍 일정</h2>
    <pre>${escapeHtml(itineraryText)}</pre>
  </div>

  <div class="card">
    <h2>🗺️ 좌표</h2>
    <ul>${coords || "<li>장소 없음</li>"}</ul>
  </div>

  <div class="card">
    <h2>🗣️ 통역 문장</h2>
    <table>
      <thead><tr><th>한국어</th><th>일본어</th><th>발음</th></tr></thead>
      <tbody>${phraseRows}</tbody>
    </table>
  </div>

  ${watermark ? '<p class="wm">Trip Planner Pro — 전체 일정 오프라인 팩</p>' : '<p class="wm">Trip Planner Pro · 오프라인 팩</p>'}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${trip.title.replace(/[<>:"/\\|?*]/g, "_").slice(0, 60)}-offline.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}
