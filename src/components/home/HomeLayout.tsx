"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Sparkles, Search } from "lucide-react";
import { HomeSplash, shouldShowHomeSplash } from "./HomeSplash";
import { PopularPlacesPanel } from "./PopularPlacesPanel";
import { TrendingPlacesPanel } from "./TrendingPlacesPanel";

type HomeLayoutProps = {
  children: ReactNode;
};

export function HomeLayout({ children }: HomeLayoutProps) {
  const [mobilePanel, setMobilePanel] = useState<"trending" | "popular" | null>(
    null
  );
  const [showSplash, setShowSplash] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    const needsSplash = shouldShowHomeSplash();
    setShowSplash(needsSplash);
    if (!needsSplash) setContentReady(true);
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setContentReady(true);
  }, []);

  return (
    <>
      {showSplash && <HomeSplash onComplete={handleSplashComplete} />}

      <div
        className={`relative min-h-screen overflow-hidden bg-[#f4f6fb] transition-opacity duration-500 ${
          contentReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
        <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-violet-300/15 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl items-start justify-center gap-5 px-4 py-8 lg:gap-6 lg:px-6 lg:py-10">
          <aside
            className={`hidden w-[min(100%,20rem)] shrink-0 xl:sticky xl:top-8 xl:block ${
              contentReady ? "home-enter-delay-1" : ""
            }`}
          >
            <TrendingPlacesPanel />
          </aside>

          <main
            className={`w-full max-w-md shrink-0 ${
              contentReady ? "home-card-enter" : ""
            }`}
          >
            {children}
          </main>

          <aside
            className={`hidden w-[min(100%,20rem)] shrink-0 xl:sticky xl:top-8 xl:block ${
              contentReady ? "home-enter-delay-2" : ""
            }`}
          >
            <PopularPlacesPanel />
          </aside>
        </div>

        <div
          className={`fixed bottom-5 left-0 right-0 z-40 flex justify-center gap-3 px-4 xl:hidden ${
            contentReady ? "home-enter" : ""
          }`}
        >
          <button
            type="button"
            onClick={() =>
              setMobilePanel((prev) => (prev === "trending" ? null : "trending"))
            }
            className="flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-lg shadow-blue-900/5 backdrop-blur-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="h-4 w-4" />
            인기 여행지
          </button>
          <button
            type="button"
            onClick={() =>
              setMobilePanel((prev) => (prev === "popular" ? null : "popular"))
            }
            className="flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/90 px-4 py-2.5 text-xs font-semibold text-amber-700 shadow-lg shadow-amber-900/5 backdrop-blur-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
              className="max-h-[78vh] w-full overflow-hidden animate-[home-fade-up_0.35s_ease-out_both]"
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
    </>
  );
}
