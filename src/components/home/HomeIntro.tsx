"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Compass, MapPin, Sparkles } from "lucide-react";

const INTRO_KEY = "trip-planner-intro-v2";

const FLOAT_DESTINATIONS = [
  { label: "東京", x: "12%", y: "22%", delay: "0.2s" },
  { label: "福岡", x: "78%", y: "18%", delay: "0.5s" },
  { label: "大阪", x: "85%", y: "55%", delay: "0.8s" },
  { label: "서울", x: "8%", y: "62%", delay: "0.6s" },
  { label: "京都", x: "72%", y: "78%", delay: "1s" },
];

type HomeIntroProps = {
  onComplete: () => void;
};

export function HomeIntro({ onComplete }: HomeIntroProps) {
  const [phase, setPhase] = useState<"play" | "exit">("play");

  const finish = () => {
    sessionStorage.setItem(INTRO_KEY, "1");
    setPhase("exit");
    window.setTimeout(onComplete, 900);
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      sessionStorage.setItem(INTRO_KEY, "1");
      onComplete();
      return;
    }

    const timer = window.setTimeout(finish, 4800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[200] overflow-hidden bg-[#060b14] transition-all duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        phase === "exit"
          ? "pointer-events-none scale-105 opacity-0"
          : "scale-100 opacity-100"
      }`}
    >
      <div className="intro-gradient absolute inset-0" />
      <div className="intro-grid absolute inset-0 opacity-[0.12]" />

      {FLOAT_DESTINATIONS.map((d) => (
        <span
          key={d.label}
          className="intro-pill absolute hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm sm:inline-block"
          style={{ left: d.x, top: d.y, animationDelay: d.delay }}
        >
          {d.label}
        </span>
      ))}

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="intro-logo mb-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-2xl shadow-blue-500/40 ring-1 ring-white/20">
          <Compass className="h-10 w-10 text-white" strokeWidth={1.5} />
        </div>

        <p className="intro-eyebrow text-[11px] font-semibold uppercase tracking-[0.4em] text-blue-300/80">
          Trip Planner
        </p>

        <h1 className="intro-headline mt-5 max-w-lg text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl">
          <span className="block overflow-hidden">
            <span className="intro-headline-line block">당신의 손쉬운</span>
          </span>
          <span className="mt-1 block overflow-hidden">
            <span className="intro-headline-line intro-headline-line-2 block bg-gradient-to-r from-sky-200 via-white to-indigo-200 bg-clip-text text-transparent">
              여행 가이드
            </span>
          </span>
        </h1>

        <p className="intro-sub mt-6 max-w-sm text-sm leading-relaxed text-slate-400 sm:text-base">
          일정 · 지도 · 맛집 · 번역 · 실시간 채팅
          <br />
          친구와 함께, 한곳에서
        </p>

        <div className="intro-badges mt-8 flex flex-wrap items-center justify-center gap-2">
          {["🗺️ 지도", "🍜 맛집", "💬 채팅", "🌐 번역"].map((badge, i) => (
            <span
              key={badge}
              className="intro-badge rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80"
              style={{ animationDelay: `${0.8 + i * 0.12}s` }}
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="intro-progress mt-12 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="intro-progress-fill h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400" />
        </div>

        <button
          type="button"
          onClick={finish}
          className="intro-skip mt-8 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-white"
        >
          바로 시작하기
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="intro-footer absolute inset-x-0 bottom-8 flex items-center justify-center gap-6 text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          실시간 협업
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Google Maps
        </span>
      </div>
    </div>
  );
}

export function shouldShowHomeIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return !sessionStorage.getItem(INTRO_KEY);
}
