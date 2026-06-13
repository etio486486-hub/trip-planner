"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Compass,
  Languages,
  MapPin,
  MessageCircle,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";
import { HomeIntro, shouldShowHomeIntro } from "./HomeIntro";
import { HomeBenefitsSection } from "./HomeBenefitsSection";
import { HomeProSection } from "@/components/pro/HomeProSection";
import { PopularPlacesPanel } from "./PopularPlacesPanel";
import { TrendingPlacesPanel } from "./TrendingPlacesPanel";
import { SettingsTrigger } from "@/components/settings/SettingsTrigger";

type HomeLayoutProps = {
  children: ReactNode;
};

const FEATURES = [
  { icon: MapPin, label: "일정 & 지도", desc: "Google Maps 연동" },
  { icon: Utensils, label: "맛집 검색", desc: "주변 맛집 추천" },
  { icon: MessageCircle, label: "멤버 채팅", desc: "실시간 소통" },
  { icon: Languages, label: "번역기", desc: "일본어·영어" },
];

const STEPS = [
  { num: "01", title: "Google 로그인", desc: "3초면 끝" },
  { num: "02", title: "여행 만들기", desc: "일정·지도 설정" },
  { num: "03", title: "친구 초대", desc: "코드로 함께" },
];

const FLOAT_CHIPS = ["🗼 도쿄", "🏯 오사카", "🌊 후쿠오카", "🏔️ 삿포로"];

export function HomeLayout({ children }: HomeLayoutProps) {
  const [showIntro, setShowIntro] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const needsIntro = shouldShowHomeIntro();
    setShowIntro(needsIntro);
    if (!needsIntro) setRevealed(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setRevealed(true);
  }, []);

  return (
    <>
      {showIntro && <HomeIntro onComplete={handleIntroComplete} />}

      <div
        className={`relative min-h-screen overflow-x-hidden bg-[#f6f8fc] transition-opacity duration-700 ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-mesh absolute -left-[20%] top-[-10%] h-[600px] w-[600px] rounded-full bg-sky-400/25 blur-[120px]" />
          <div className="hero-mesh-delay absolute -right-[15%] top-[5%] h-[500px] w-[500px] rounded-full bg-indigo-400/20 blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-violet-300/10 blur-[100px]" />
          <div className="home-dot-grid absolute inset-0 opacity-[0.35]" />
        </div>

        {/* Nav */}
        <header
          className={`sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl safe-top ${
            revealed ? "home-enter" : ""
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
                <Compass className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-zinc-900">
                  Trip Planner
                </p>
                <p className="hidden text-[11px] text-zinc-500 sm:block">
                  함께 만드는 스마트 여행
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-6 text-xs font-medium text-zinc-500 md:flex">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  실시간 협업
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Google Maps
                </span>
              </div>
              <SettingsTrigger compact />
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14 lg:pb-32 lg:pt-16">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20">
            {/* Left — copy */}
            <div
              className={`relative ${revealed ? "home-enter-delay-1" : "opacity-0"}`}
            >
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                실시간 협업 여행 플래너
              </p>

              <h1 className="max-w-xl text-[2.5rem] font-bold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.5rem] xl:text-6xl">
                여행 준비,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  이제 더 쉽게
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-600 sm:text-lg">
                일정, 지도, 맛집, 번역까지 한곳에서.
                친구와 실시간으로 함께 계획하세요.
              </p>

              {/* Feature grid — desktop 2×2, mobile 2 col */}
              <div className="mt-10 grid grid-cols-2 gap-3 lg:max-w-xl">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="group flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-3.5 shadow-sm transition-all hover:border-blue-100 hover:shadow-md sm:p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 transition-colors group-hover:from-blue-100 group-hover:to-indigo-100">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">
                        {label}
                      </p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating chips — desktop only */}
              <div className="mt-8 hidden flex-wrap gap-2 lg:flex">
                {FLOAT_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — auth card */}
            <div
              className={`relative mx-auto w-full max-w-md md:mx-0 md:max-w-none md:justify-self-end lg:sticky lg:top-24 ${
                revealed ? "home-card-enter" : "opacity-0"
              }`}
            >
              <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-violet-500/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white bg-white p-6 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.15)] ring-1 ring-slate-900/[0.04] sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-50/80 blur-2xl" />
                <div className="relative">{children}</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          className={`relative z-10 border-y border-slate-200/50 bg-white/40 py-8 backdrop-blur-sm sm:py-10 ${
            revealed ? "home-enter-delay-2" : "opacity-0"
          }`}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 sm:grid-cols-3 sm:gap-8 sm:px-8">
            {STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <span className="text-2xl font-bold tabular-nums text-blue-200">
                  {step.num}
                </span>
                <div>
                  <p className="font-semibold text-zinc-900">{step.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why use us — benefits & promo */}
        <HomeBenefitsSection
          className={`py-16 sm:py-20 ${revealed ? "home-enter-delay-2" : "opacity-0"}`}
        />

        <HomeProSection
          className={`pb-16 sm:pb-20 ${revealed ? "home-enter-delay-2" : "opacity-0"}`}
        />

        {/* Discover */}
        <section
          className={`relative z-10 px-5 py-16 sm:px-8 sm:py-20 ${
            revealed ? "home-enter-delay-2" : "opacity-0"
          }`}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                  Discover
                </p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">
                  어디로 떠날까요?
                </h2>
                <p className="mt-2 text-sm text-zinc-500 sm:text-base">
                  인기 여행지와 멤버들이 많이 가는 장소
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <TrendingPlacesPanel className="h-full" />
              <PopularPlacesPanel className="h-full" />
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-slate-200/60 bg-white/50 px-5 py-8 safe-bottom sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-zinc-400 sm:flex-row">
            <span>© Trip Planner · Google Maps · Supabase Realtime</span>
            <span className="text-zinc-300">일정 · 지도 · 맛집 · 번역 · 채팅</span>
          </div>
        </footer>
      </div>
    </>
  );
}
