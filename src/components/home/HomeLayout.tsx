"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Compass, MapPin, MessageCircle, Utensils, Languages } from "lucide-react";
import { HomeIntro, shouldShowHomeIntro } from "./HomeIntro";
import { PopularPlacesPanel } from "./PopularPlacesPanel";
import { TrendingPlacesPanel } from "./TrendingPlacesPanel";

type HomeLayoutProps = {
  children: ReactNode;
};

const FEATURES = [
  { icon: MapPin, label: "일정 & 지도", desc: "Google Maps 연동" },
  { icon: Utensils, label: "맛집 검색", desc: "주변 맛집 추천" },
  { icon: MessageCircle, label: "멤버 채팅", desc: "실시간 소통" },
  { icon: Languages, label: "번역기", desc: "일본어·영어" },
];

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
        className={`relative min-h-screen overflow-x-hidden bg-[#f8fafc] transition-opacity duration-700 ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Hero background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-mesh absolute -left-1/4 top-0 h-[70vh] w-[70vw] rounded-full bg-blue-400/20 blur-[100px]" />
          <div className="hero-mesh-delay absolute -right-1/4 top-1/4 h-[60vh] w-[60vw] rounded-full bg-indigo-400/15 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
        </div>

        {/* Nav */}
        <header
          className={`relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 safe-top sm:px-8 ${
            revealed ? "home-enter" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25">
              <Compass className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-900">
              Trip Planner
            </span>
          </div>
          <span className="hidden text-xs text-zinc-500 sm:inline">
            함께 만드는 스마트 여행
          </span>
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-4 sm:px-8 sm:pb-24 sm:pt-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr,min(420px,100%)] lg:gap-16">
            <div className={revealed ? "home-enter-delay-1" : "opacity-0"}>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                실시간 협업 여행 플래너
              </p>

              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem]">
                여행 준비,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  이제 더 쉽게
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600 sm:text-lg">
                일정, 지도, 맛집, 번역까지 한곳에서.
                <br className="hidden sm:block" />
                친구와 실시간으로 함께 계획하세요.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/60 px-3 py-2.5 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">
                        {label}
                      </p>
                      <p className="text-[10px] text-zinc-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`relative ${revealed ? "home-card-enter" : "opacity-0"}`}
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10 blur-xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/90 bg-white/95 p-6 shadow-2xl shadow-slate-900/[0.08] ring-1 ring-slate-900/[0.04] backdrop-blur-md sm:p-8">
                {children}
              </div>
            </div>
          </div>
        </section>

        {/* Discover */}
        <section
          className={`relative z-10 border-t border-slate-200/60 bg-white/50 px-5 py-14 backdrop-blur-sm sm:px-8 ${
            revealed ? "home-enter-delay-2" : "opacity-0"
          }`}
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                어디로 떠날까요?
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                인기 여행지와 멤버들이 많이 가는 장소
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <TrendingPlacesPanel className="h-full" />
              <PopularPlacesPanel className="h-full" />
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-slate-200/60 px-5 py-6 text-center text-xs text-zinc-400 safe-bottom">
          Trip Planner · Google Maps · Supabase Realtime
        </footer>
      </div>
    </>
  );
}
