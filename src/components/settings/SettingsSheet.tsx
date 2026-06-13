"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  Map,
  RotateCcw,
  Smartphone,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import {
  FONT_SCALE_OPTIONS,
  MOBILE_VIEW_OPTIONS,
} from "@/lib/app-settings";
import { useAppSettings } from "./SettingsProvider";

type SettingsSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const {
    settings,
    setFontScale,
    setMobileDefaultView,
    setReduceMotion,
    setExpandNearbyRestaurants,
    setHidePwaInstallHint,
    resetSettings,
  } = useAppSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 px-0 backdrop-blur-[1px] sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="설정"
        className="flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3.5">
          <h2 className="text-base font-bold text-zinc-900">설정</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <section className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <Type className="h-4 w-4 text-blue-600" />
              글씨 크기
            </div>
            <p className="mb-3 text-xs leading-relaxed text-zinc-500">
              버튼·간격 비율은 유지하고 글자만 키웁니다.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SCALE_OPTIONS.map((opt) => {
                const active = settings.fontScale === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFontScale(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition ${
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <span
                      className="font-bold leading-none"
                      style={{ fontSize: `${14 * opt.value}px` }}
                    >
                      {opt.hint}
                    </span>
                    <span className="text-[10px] font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <Smartphone className="h-4 w-4 text-indigo-600" />
              모바일 기본 화면
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              여행 화면에 들어올 때 또는 변경 즉시 적용됩니다.
            </p>
            <div className="space-y-2">
              {MOBILE_VIEW_OPTIONS.map((opt) => {
                const active = settings.mobileDefaultView === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMobileDefaultView(opt.value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          active ? "text-indigo-800" : "text-zinc-800"
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-zinc-500">{opt.desc}</p>
                    </div>
                    {active && (
                      <Map className="h-4 w-4 shrink-0 text-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-4 space-y-3">
            <p className="text-sm font-semibold text-zinc-800">편의</p>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-3 py-3">
              <input
                type="checkbox"
                checked={settings.expandNearbyRestaurants}
                onChange={(e) => setExpandNearbyRestaurants(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  주변 맛집 기본 펼치기
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">
                  일정 장소마다 추천 맛집 목록을 처음부터 표시
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-3 py-3">
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
                  <Eye className="h-3.5 w-3.5 text-zinc-500" />
                  애니메이션 줄이기
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">
                  화면 전환·움직임을 최소화 (어지러움 완화)
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-3 py-3">
              <input
                type="checkbox"
                checked={settings.hidePwaInstallHint}
                onChange={(e) => setHidePwaInstallHint(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600"
              />
              <span>
                <span className="text-sm font-medium text-zinc-800">
                  앱 설치 안내 숨기기
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">
                  모바일 하단 「홈 화면에 추가」 배너 끄기
                </span>
              </span>
            </label>
          </section>
        </div>

        <div className="shrink-0 border-t border-zinc-100 px-4 py-3 safe-bottom">
          <button
            type="button"
            onClick={() => resetSettings()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <RotateCcw className="h-4 w-4" />
            설정 초기화
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
