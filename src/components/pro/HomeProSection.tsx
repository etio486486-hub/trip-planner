"use client";

import { Crown, Sparkles } from "lucide-react";
import { PRO_FEATURES, PRO_PRICE_LABEL } from "@/lib/pro-features";
import { usePro } from "@/hooks/usePro";
import { ProBadge } from "./ProBadge";
import { formatProUntil } from "@/lib/pro";

type HomeProSectionProps = {
  className?: string;
};

export function HomeProSection({ className = "" }: HomeProSectionProps) {
  const { isPro, profile, preview } = usePro();
  const proUntil = formatProUntil(profile?.pro_until ?? null);

  return (
    <section className={`relative z-10 ${className}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-lg">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                  Pro Upgrade
                </span>
                {isPro && <ProBadge size="md" />}
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                여행 중 더 편하게,
                <br />
                <span className="text-amber-700">Pro로 업그레이드</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
                대화형 통역, iPhone 음성 입력, PDF 내보내기 등
                해외여행에서 체감되는 기능을 하나씩 추가하고 있습니다.
              </p>
              <p className="mt-4 text-lg font-bold text-zinc-900">
                {PRO_PRICE_LABEL}
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  (결제 연동 예정)
                </span>
              </p>
              {isPro && (
                <p className="mt-2 text-sm font-medium text-green-700">
                  ✓ Pro 활성화됨
                  {proUntil ? ` · ${proUntil}까지` : ""}
                  {preview ? " (미리보기 모드)" : ""}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Pro 기능 로드맵
              </p>
              <ul className="space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 border-b border-zinc-100 pb-3 last:border-0 last:pb-0"
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        f.implemented
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {f.implemented ? "✓" : "·"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {f.name}
                        {f.implemented && (
                          <span className="ml-1.5 text-[10px] font-semibold text-green-600">
                            사용 가능
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">{f.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
