"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  canUseProFeature,
  isProActive,
  isProPreviewEnabled,
  type UserProProfile,
} from "@/lib/pro";
import type { ProFeatureId } from "@/lib/pro-features";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export function usePro() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await getSupabase()
      .from("user_profiles")
      .select("is_pro, pro_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      setProfile({ is_pro: false, pro_until: null });
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isPro = isProActive(profile);
  const preview = isProPreviewEnabled();

  const hasFeature = useCallback(
    (featureId: ProFeatureId) => canUseProFeature(profile, featureId),
    [profile]
  );

  return {
    profile,
    isPro,
    preview,
    loading,
    refresh,
    hasFeature,
  };
}
