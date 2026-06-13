"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  FREEMIUM_LIMITS,
  type FreemiumFeatureId,
} from "@/lib/freemium-limits";
import type { FreemiumUsageSnapshot } from "@/lib/freemium-usage-server";
import { usePro } from "@/hooks/usePro";

type UsageMap = Partial<Record<FreemiumFeatureId, FreemiumUsageSnapshot>>;

export function useFreemiumUsage() {
  const { user } = useAuth();
  const { isPro, loading: proLoading } = usePro();
  const [usage, setUsage] = useState<UsageMap>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setUsage({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pro/usage");
      if (res.ok) {
        const data = (await res.json()) as { usage?: UsageMap };
        setUsage(data.usage ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh, isPro]);

  const getSnapshot = useCallback(
    (featureId: FreemiumFeatureId): FreemiumUsageSnapshot => {
      if (isPro) {
        return {
          featureId,
          used: 0,
          limit: FREEMIUM_LIMITS[featureId].limit,
          remaining: FREEMIUM_LIMITS[featureId].limit,
          periodKey: "",
          canUse: true,
        };
      }
      return (
        usage[featureId] ?? {
          featureId,
          used: 0,
          limit: FREEMIUM_LIMITS[featureId].limit,
          remaining: FREEMIUM_LIMITS[featureId].limit,
          periodKey: "",
          canUse: true,
        }
      );
    },
    [isPro, usage]
  );

  const consume = useCallback(
    async (
      featureId: FreemiumFeatureId
    ): Promise<{ ok: boolean; error?: string }> => {
      if (isPro) return { ok: true };

      const res = await fetch("/api/pro/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureId }),
      });

      const data = (await res.json()) as {
        error?: string;
        usage?: FreemiumUsageSnapshot;
      };

      if (res.ok && data.usage) {
        setUsage((prev) => ({ ...prev, [featureId]: data.usage! }));
        return { ok: true };
      }

      if (data.usage) {
        setUsage((prev) => ({ ...prev, [featureId]: data.usage! }));
      }

      return { ok: false, error: data.error ?? "사용 한도에 도달했습니다." };
    },
    [isPro]
  );

  return {
    isPro,
    loading: loading || proLoading,
    usage,
    refresh,
    getSnapshot,
    consume,
  };
}
