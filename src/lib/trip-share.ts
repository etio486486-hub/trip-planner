import { formatMoney, formatDateKo } from "./format";
import {
  computeMemberBalances,
  computeSettlementTransfers,
  totalInBase,
} from "./expense-settlement";
import {
  loadExchangeRates,
  type TripExchangeRates,
} from "./exchange-rates";
import type { ExpenseCurrency } from "./trip-constants";
import type {
  ChecklistItem,
  DailyPlan,
  Expense,
  Place,
  Trip,
  TripMember,
} from "@/types/database";

function formatTimeLine(time: string | null, duration: number | null): string {
  const parts: string[] = [];
  if (time) parts.push(time);
  if (duration != null && duration > 0) parts.push(`${duration}분`);
  return parts.length > 0 ? ` (${parts.join(" · ")})` : "";
}

export function buildItineraryShareText(
  trip: Trip,
  dailyPlans: DailyPlan[],
  placesByDay: Map<number, Place[]>
): string {
  const lines: string[] = [
    `📍 ${trip.title}`,
    `📅 ${trip.start_date} ~ ${trip.end_date}`,
    "",
  ];

  const sorted = [...dailyPlans].sort((a, b) => a.day_number - b.day_number);

  for (const plan of sorted) {
    const places = placesByDay.get(plan.day_number) ?? [];
    lines.push(`━━ ${plan.day_number}일차 ━━`);
    if (places.length === 0) {
      lines.push("  (장소 없음)");
    } else {
      places.forEach((p, i) => {
        lines.push(
          `  ${i + 1}. ${p.name}${formatTimeLine(p.visit_time, p.duration_minutes)}`
        );
        if (p.memo) lines.push(`     📝 ${p.memo}`);
      });
    }
    lines.push("");
  }

  lines.push("— trip-planner —");
  return lines.join("\n");
}

export function buildDayItineraryShareText(
  trip: Trip,
  dayNumber: number,
  places: Place[]
): string {
  const lines: string[] = [
    `📍 ${trip.title} · ${dayNumber}일차`,
    "",
  ];

  if (places.length === 0) {
    lines.push("(장소 없음)");
  } else {
    places.forEach((p, i) => {
      lines.push(
        `${i + 1}. ${p.name}${formatTimeLine(p.visit_time, p.duration_minutes)}`
      );
      if (p.memo) lines.push(`   📝 ${p.memo}`);
    });
  }

  return lines.join("\n");
}

export function buildExpenseShareText(
  trip: Trip,
  expenses: Expense[],
  members: TripMember[],
  tripId: string,
  rates?: TripExchangeRates
): string {
  const r = rates ?? loadExchangeRates(tripId);
  const lines: string[] = [
    `💰 ${trip.title} 가계부`,
    "",
  ];

  const total = totalInBase(expenses, r);
  const symbol =
    r.baseCurrency === "KRW" ? "₩" : r.baseCurrency === "JPY" ? "¥" : "$";
  lines.push(`총 지출 (≈${r.baseCurrency}): ${symbol}${Math.round(total).toLocaleString()}`);
  lines.push("");

  const byMember = new Map<string, Record<string, number>>();
  for (const exp of expenses) {
    const name = exp.paid_by_name ?? "미지정";
    const map = byMember.get(name) ?? {};
    map[exp.currency] = (map[exp.currency] ?? 0) + exp.amount;
    byMember.set(name, map);
  }

  lines.push("【결제 내역】");
  for (const [name, totals] of byMember) {
    const parts = Object.entries(totals).map(([c, a]) =>
      formatMoney(a, c as ExpenseCurrency)
    );
    lines.push(`· ${name}: ${parts.join(" + ")}`);
  }
  lines.push("");

  const balances = computeMemberBalances(expenses, members, r);
  const transfers = computeSettlementTransfers(balances, r.baseCurrency);

  if (transfers.length > 0) {
    lines.push("【정산】");
    for (const t of transfers) {
      lines.push(
        `· ${t.fromName} → ${t.toName} ${formatMoney(t.amount, t.currency)}`
      );
    }
  } else if (expenses.length > 0) {
    lines.push("정산 완료 (차액 없음)");
  }

  lines.push("");
  lines.push("— trip-planner —");
  return lines.join("\n");
}

export function buildChecklistShareText(
  trip: Trip,
  items: ChecklistItem[]
): string {
  const lines: string[] = [
    `✅ ${trip.title} 체크리스트`,
    `진행: ${items.filter((i) => i.is_checked).length}/${items.length}`,
    "",
  ];

  const byCat = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const list = byCat.get(item.category) ?? [];
    list.push(item);
    byCat.set(item.category, list);
  }

  for (const [cat, list] of byCat) {
    lines.push(`[${cat}]`);
    for (const item of list) {
      const mark = item.is_checked ? "☑" : "☐";
      const who = item.assigned_to_name ? ` @${item.assigned_to_name}` : "";
      lines.push(`${mark} ${item.title}${who}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function fetchAllPlacesByDay(
  tripId: string,
  dailyPlans: DailyPlan[]
): Promise<Map<number, Place[]>> {
  const { getSupabase } = await import("@/lib/supabase/client");
  const map = new Map<number, Place[]>();

  for (const plan of dailyPlans) {
    const { data } = await getSupabase()
      .from("places")
      .select("*")
      .eq("daily_plan_id", plan.id)
      .order("visit_order", { ascending: true });

    map.set(
      plan.day_number,
      (data ?? []).map((p) => ({
        ...p,
        visit_time: p.visit_time ?? null,
        duration_minutes: p.duration_minutes ?? null,
      }))
    );
  }

  return map;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const input = document.createElement("textarea");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      return true;
    } catch {
      return false;
    }
  }
}
