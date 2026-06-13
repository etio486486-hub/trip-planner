"use client";

import {
  Clock,
  Globe,
  Layers,
  MapPinned,
  Share2,
  Zap,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Layers,
    title: "앱 여러 개, 이제 그만",
    desc: "카톡·스프레드시트·지도·번역 앱을 오가지 않아도 됩니다. 여행 준비에 필요한 모든 걸 한 화면에서.",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    icon: Zap,
    title: "수정하면 즉시 반영",
    desc: "친구가 일정을 바꾸면 내 화면도 실시간으로 업데이트. \"그거 어디 적어뒀더라?\" 다시 물어볼 필요 없어요.",
    accent: "from-violet-500 to-purple-600",
  },
  {
    icon: MapPinned,
    title: "지도에 바로 보이는 일정",
    desc: "장소 순서를 드래그하면 Google Maps에 경로와 마커가 자동으로 표시. 현장에서도 헤매지 않아요.",
    accent: "from-sky-500 to-blue-600",
  },
  {
    icon: Globe,
    title: "해외여행도 걱정 없이",
    desc: "일본어·영어 번역기 내장. 현지에서 필요한 표현을 바로 확인하고, 일정에도 바로 반영할 수 있어요.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    icon: Share2,
    title: "초대는 6자리 코드로",
    desc: "링크 복붙 없이 초대 코드만 공유하면 친구가 바로 합류. 누가 어디에 있는지도 실시간으로 확인.",
    accent: "from-orange-500 to-amber-600",
  },
  {
    icon: Clock,
    title: "3초면 시작",
    desc: "Google 로그인 한 번이면 끝. 별도 가입·앱 설치 없이 브라우저에서 바로 여행을 만들 수 있어요.",
    accent: "from-pink-500 to-rose-600",
  },
];

const USE_CASES = [
  {
    emoji: "👫",
    title: "친구와 해외여행",
    quote: "카톡에 링크 10개 보내는 대신, 한 지도에서 같이 계획해요.",
  },
  {
    emoji: "💑",
    title: "커플·연인 여행",
    quote: "취향 다른 코스도 실시간으로 조율하고, 맛집은 지도에서 바로 추가.",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "가족 여행",
    quote: "체크리스트·가계부까지 한곳에서. 준비물 빠뜨릴 걱정 줄이기.",
  },
];

const COMPARE = [
  { before: "카톡에 주소 복붙", after: "지도에 핀 한 번" },
  { before: "엑셀 버전 5개", after: "실시간 하나의 일정" },
  { before: "맛집 따로 검색", after: "일정 옆에서 바로 추가" },
];

type HomeBenefitsSectionProps = {
  className?: string;
};

export function HomeBenefitsSection({ className = "" }: HomeBenefitsSectionProps) {
  return (
    <section className={`relative z-10 ${className}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* 헤더 */}
        <div className="mb-10 text-center md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Why Trip Planner
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl lg:text-4xl">
            여행 준비,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              이렇게 달라집니다
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            메신저·스프레드시트·지도 앱을 번갈아 쓰던 방식에서 벗어나세요.
            <br className="hidden sm:inline" />
            Trip Planner 하나로 계획부터 현장까지 이어집니다.
          </p>
        </div>

        {/* 혜택 카드 6개 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {BENEFITS.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white bg-white/90 p-5 shadow-sm ring-1 ring-slate-900/[0.04] transition-all hover:border-blue-100 hover:shadow-md sm:p-6"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md transition-transform group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="text-base font-bold text-zinc-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Before → After */}
        <div className="mt-10 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-violet-50/80 p-6 sm:mt-14 sm:p-8">
          <p className="mb-5 text-center text-sm font-semibold text-zinc-700">
            기존 방식 vs Trip Planner
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {COMPARE.map(({ before, after }) => (
              <div
                key={before}
                className="flex flex-col items-center gap-2 rounded-xl bg-white/80 px-4 py-4 text-center shadow-sm"
              >
                <span className="text-xs text-zinc-400 line-through">
                  {before}
                </span>
                <span className="text-lg text-blue-400">↓</span>
                <span className="text-sm font-semibold text-blue-700">
                  {after}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 사용 시나리오 */}
        <div className="mt-10 sm:mt-14">
          <h3 className="mb-6 text-center text-lg font-bold text-zinc-900 sm:text-xl">
            이런 여행에 딱 맞아요
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {USE_CASES.map(({ emoji, title, quote }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <span className="text-2xl">{emoji}</span>
                <p className="mt-3 font-semibold text-zinc-900">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA 배너 */}
        <div className="mt-10 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-center shadow-xl shadow-blue-600/20 sm:mt-14 sm:p-10">
          <p className="text-lg font-bold text-white sm:text-xl">
            무료 · 브라우저에서 바로 · 설치 불필요
          </p>
          <p className="mt-2 text-sm text-blue-100">
            Google 로그인 3초면 첫 여행을 만들 수 있어요. 친구 초대도 코드
            하나면 끝.
          </p>
        </div>
      </div>
    </section>
  );
}
