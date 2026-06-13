import { canUseProFeature, type UserProProfile } from "@/lib/pro";
import type { ProFeatureId } from "@/lib/pro-features";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedProProfile(): Promise<{
  userId: string | null;
  profile: UserProProfile | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { userId: null, profile: null };
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("is_pro, pro_until")
      .eq("user_id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      profile: data ?? { is_pro: false, pro_until: null },
    };
  } catch {
    return { userId: null, profile: null };
  }
}

export async function requireProFeature(
  featureId: ProFeatureId
): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const { userId, profile } = await getAuthenticatedProProfile();

  if (!userId) {
    return { ok: false, status: 401, error: "로그인이 필요합니다." };
  }

  if (!canUseProFeature(profile, featureId)) {
    return { ok: false, status: 403, error: "Pro 구독이 필요합니다." };
  }

  return { ok: true, userId };
}
