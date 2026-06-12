"use client";

import { useState, type ReactNode } from "react";
import { Sparkles, Search } from "lucide-react";
import { PopularPlacesPanel } from "./PopularPlacesPanel";
import { TrendingPlacesPanel } from "./TrendingPlacesPanel";

type HomeLayoutProps = {
  children: ReactNode;
};

export function HomeLayout({ children }: HomeLayoutProps) {
  const [mobilePanel, setMobilePanel] = useState<"trending" | "popular" | null>(
    null
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl items-start justify-center gap-5 px-4 py-8 lg:gap-6 lg:px-6 lg:py-10">
        <aside className="hidden w-[min(100%,20rem)] shrink-0 xl:sticky xl:top-8 xl:block">
          <TrendingPlacesPanel />
        </aside>

        <main className="w-full max-w-md shrink-0">{children}</main>

        <aside className="hidden w-[min(100%,20rem)] shrink-0 xl:sticky xl:top-8 xl:block">
          <PopularPlacesPanel />
        </aside>
      </div>

      {/* 모바일·태블릿: 하단 플로팅 버튼 */}
      <div className="fixed bottom-5 left-0 right-0 z-40 flex justify-center gap-3 px-4 xl:hidden">
        <button
          type="button"
          onClick={() =>
            setMobilePanel((prev) => (prev === "trending" ? null : "trending"))
          }
          className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-lg backdrop-blur-sm"
        >
          <Search className="h-4 w-4" />
          인기 여행지
        </button>
        <button
          type="button"
          onClick={() =>
            setMobilePanel((prev) => (prev === "popular" ? null : "popular"))
          }
          className="flex items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-4 py-2.5 text-xs font-semibold text-amber-700 shadow-lg backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4" />
          멤버 추천
        </button>
      </div>

      {mobilePanel && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 backdrop-blur-[2px] xl:hidden"
          onClick={() => setMobilePanel(null)}
        >
          <div
            className="max-h-[78vh] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {mobilePanel === "trending" ? (
              <TrendingPlacesPanel onClose={() => setMobilePanel(null)} />
            ) : (
              <PopularPlacesPanel onClose={() => setMobilePanel(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
