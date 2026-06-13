"use client";

import { useEffect, useState } from "react";
import { Compass, MapPin } from "lucide-react";

const SPLASH_KEY = "trip-planner-splash-v1";

type HomeSplashProps = {
  onComplete: () => void;
};

export function HomeSplash({ onComplete }: HomeSplashProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onComplete();
      return;
    }

    const holdTimer = window.setTimeout(() => setPhase("exit"), 2400);
    const exitTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#0b1220] transition-opacity duration-700 ${
        phase === "exit" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={phase === "exit"}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="splash-orb splash-orb-a absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="splash-orb splash-orb-b absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="splash-grid absolute inset-0 opacity-[0.07]" />
      </div>

      <div
        className={`relative px-8 text-center transition-all duration-700 ${
          phase === "enter"
            ? "translate-y-0 opacity-100"
            : phase === "hold"
              ? "translate-y-0 opacity-100"
              : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="splash-logo mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 ring-1 ring-white/20">
          <Compass className="h-8 w-8 text-white" strokeWidth={1.75} />
        </div>

        <p className="splash-line-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-300/90">
          Trip Planner
        </p>

        <h1 className="splash-line-2 mt-4 text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl">
          당신의 손쉬운
          <br />
          <span className="bg-gradient-to-r from-blue-200 via-white to-indigo-200 bg-clip-text text-transparent">
            여행 가이드
          </span>
        </h1>

        <p className="splash-line-3 mx-auto mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
          일정 · 지도 · 맛집 · 번역까지
          <br />
          함께 떠나는 여행을 시작하세요
        </p>

        <div className="splash-line-4 mx-auto mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span>실시간으로 함께 만드는 여행</span>
        </div>

        <div className="splash-progress mx-auto mt-10 h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="splash-progress-bar h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-300" />
        </div>
      </div>
    </div>
  );
}

export function shouldShowHomeSplash(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return !sessionStorage.getItem(SPLASH_KEY);
}
