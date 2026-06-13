import type { ProFeatureId } from "./pro-features";
import { getProFeature } from "./pro-features";

export type UserProProfile = {
  is_pro: boolean;
  pro_until: string | null;
};

export function isProPreviewEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRO_PREVIEW === "true";
}

export function isProActive(profile: UserProProfile | null): boolean {
  if (isProPreviewEnabled()) return true;
  if (!profile?.is_pro) return false;
  if (!profile.pro_until) return true;
  return new Date(profile.pro_until) > new Date();
}

export function canUseProFeature(
  profile: UserProProfile | null,
  featureId: ProFeatureId
): boolean {
  const feature = getProFeature(featureId);
  if (!feature?.implemented) return false;
  return isProActive(profile);
}

export function formatProUntil(until: string | null): string | null {
  if (!until) return null;
  try {
    return new Date(until).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}
