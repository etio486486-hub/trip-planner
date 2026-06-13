import { isProActive, type UserProProfile } from "@/lib/pro";
import {
  FREEMIUM_LIMITS,
  type FreemiumFeatureId,
} from "@/lib/freemium-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FreemiumUsageSnapshot = {
  featureId: FreemiumFeatureId;
  used: number;
  limit: number;
  remaining: number;
  periodKey: string;
  canUse: boolean;
};

function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export function getFreemiumPeriodKey(featureId: FreemiumFeatureId): string {
  const def = FREEMIUM_LIMITS[featureId];
  const kst = kstNow();

  if (def.period === "month") {
    return kst.toISOString().slice(0, 7);
  }
  if (def.period === "day") {
    return kst.toISOString().slice(0, 10);
  }
  return "lifetime";
}

async function readUsageCount(
  userId: string,
  featureId: FreemiumFeatureId
): Promise<number> {
  const periodKey = getFreemiumPeriodKey(featureId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("pro_feature_usage")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("feature_id", featureId)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (error) {
    console.warn("[freemium] read usage failed:", error.message);
    return 0;
  }

  return data?.usage_count ?? 0;
}

export function buildUsageSnapshot(
  featureId: FreemiumFeatureId,
  used: number,
  isPro: boolean
): FreemiumUsageSnapshot {
  const def = FREEMIUM_LIMITS[featureId];
  const remaining = isPro ? def.limit : Math.max(0, def.limit - used);

  return {
    featureId,
    used: isPro ? 0 : used,
    limit: def.limit,
    remaining: isPro ? def.limit : remaining,
    periodKey: getFreemiumPeriodKey(featureId),
    canUse: isPro || used < def.limit,
  };
}

export async function getFreemiumUsageSnapshot(
  userId: string,
  profile: UserProProfile | null,
  featureId: FreemiumFeatureId
): Promise<FreemiumUsageSnapshot> {
  const isPro = isProActive(profile);
  if (isPro) {
    return buildUsageSnapshot(featureId, 0, true);
  }

  const used = await readUsageCount(userId, featureId);
  return buildUsageSnapshot(featureId, used, false);
}

export async function getAllFreemiumUsage(
  userId: string,
  profile: UserProProfile | null
): Promise<FreemiumUsageSnapshot[]> {
  const ids = Object.keys(FREEMIUM_LIMITS) as FreemiumFeatureId[];
  return Promise.all(
    ids.map((id) => getFreemiumUsageSnapshot(userId, profile, id))
  );
}

export async function consumeFreemiumUsage(
  userId: string,
  profile: UserProProfile | null,
  featureId: FreemiumFeatureId
): Promise<
  | { ok: true; snapshot: FreemiumUsageSnapshot }
  | { ok: false; status: number; error: string; snapshot: FreemiumUsageSnapshot }
> {
  const isPro = isProActive(profile);
  const snapshot = await getFreemiumUsageSnapshot(userId, profile, featureId);

  if (isPro) {
    return { ok: true, snapshot };
  }

  if (!snapshot.canUse) {
    return {
      ok: false,
      status: 403,
      error: getFreemiumLimitMessage(featureId),
      snapshot,
    };
  }

  const periodKey = getFreemiumPeriodKey(featureId);
  const nextCount = snapshot.used + 1;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("pro_feature_usage").upsert(
    {
      user_id: userId,
      feature_id: featureId,
      period_key: periodKey,
      usage_count: nextCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,feature_id,period_key" }
  );

  if (error) {
    console.error("[freemium] consume failed:", error.message);
    return {
      ok: false,
      status: 500,
      error: "사용량 기록에 실패했습니다.",
      snapshot,
    };
  }

  return {
    ok: true,
    snapshot: buildUsageSnapshot(featureId, nextCount, false),
  };
}

export function getFreemiumLimitMessage(featureId: FreemiumFeatureId): string {
  const def = FREEMIUM_LIMITS[featureId];
  if (featureId === "ai_recommend") {
    return "무료 AI 추천은 이번 달 1회까지입니다. Pro로 무제한 이용하세요.";
  }
  if (featureId === "conversation_mode") {
    return "대화형 통역 미리보기 3회를 모두 사용했습니다. Pro로 업그레이드하세요.";
  }
  if (featureId === "live_exchange") {
    return "오늘 무료 환율 갱신을 이미 사용했습니다. Pro는 무제한 갱신 가능합니다.";
  }
  return `Pro ${def.freeHint}`;
}
