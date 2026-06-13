"use client";

import { Check, Crown, Sparkles } from "lucide-react";
import {
  FREEMIUM_TEASERS,
  PRO_FEATURES,
  PRO_PRICE_LABEL,
  type ProFeatureId,
} from "@/lib/pro-features";
import { getProFeature } from "@/lib/pro-features";
import { usePro } from "@/hooks/usePro";
import { ProBadge } from "./ProBadge";

type ProUpgradePanelProps = {
  featureId: ProFeatureId;
  compact?: boolean;
  className?: string;
};

export function ProUpgradePanel({
  featureId,
  compact = false,
  className = "",
}: ProUpgradePanelProps) {
  const { isPro, preview } = usePro();
  const feature = getProFeature(featureId);

  if (isPro || !feature) return null;

  if (compact) {
    return (
      <div
        className={`rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <Crown className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              {feature.name}
              <ProBadge />
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              {feature.description}
            </p>
            {FREEMIUM_TEASERS[featureId] && (
              <p className="mt-1.5 text-[11px] text-amber-700">
                {FREEMIUM_TEASERS[featureId]}
              </p>
            )}
            <p className="mt-2 text-xs font-semibold text-amber-800">
              Pro {PRO_PRICE_LABEL} · 결제 연동 준비 중
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-lg ${className}`}
    >
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-5 py-6 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider opacity-90">
            Trip Planner Pro
          </span>
        </div>
        <h3 className="mt-2 text-xl font-bold">{feature.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          {feature.description}
        </p>
        <p className="mt-4 text-2xl font-bold">
          {PRO_PRICE_LABEL}
          <span className="ml-1 text-sm font-normal opacity-80">(예정)</span>
        </p>
      </div>

      <div className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Pro에 포함되는 기능
        </p>
        <ul className="space-y-2.5">
          {PRO_FEATURES.map((f) => (
            <li key={f.id} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  f.implemented
                    ? "bg-green-100 text-green-600"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {f.name}
                  {f.id === featureId && (
                    <span className="ml-1.5 text-xs text-amber-600">
                      ← 지금 보는 기능
                    </span>
                  )}
                  {!f.implemented && (
                    <span className="ml-1.5 text-[10px] text-zinc-400">
                      (준비 중)
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-center">
          <p className="text-sm font-medium text-zinc-700">
            결제 연동 준비 중입니다
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            베타 테스트는 관리자에게 Pro 활성화를 요청해 주세요.
          </p>
          {preview && (
            <p className="mt-2 text-xs text-amber-700">
              개발 모드: NEXT_PUBLIC_PRO_PREVIEW=true
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
