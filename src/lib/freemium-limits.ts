import type { ProFeatureId } from "./pro-features";

/** 맛보기(횟수 제한)가 있는 Pro 기능 */
export type FreemiumFeatureId = Extract<
  ProFeatureId,
  "ai_recommend" | "conversation_mode" | "live_exchange" | "weather_ai_reschedule"
>;

export type FreemiumPeriod = "month" | "day" | "lifetime";

export type FreemiumLimitDef = {
  id: FreemiumFeatureId;
  limit: number;
  period: FreemiumPeriod;
  /** 무료 사용자 UI 안내 */
  freeHint: string;
};

export const FREEMIUM_LIMITS: Record<FreemiumFeatureId, FreemiumLimitDef> = {
  ai_recommend: {
    id: "ai_recommend",
    limit: 1,
    period: "month",
    freeHint: "무료: 월 1회 · 1일치만 추가",
  },
  conversation_mode: {
    id: "conversation_mode",
    limit: 3,
    period: "lifetime",
    freeHint: "무료: 미리보기 3회",
  },
  live_exchange: {
    id: "live_exchange",
    limit: 1,
    period: "day",
    freeHint: "무료: 하루 1회 자동 갱신",
  },
  weather_ai_reschedule: {
    id: "weather_ai_reschedule",
    limit: 1,
    period: "month",
    freeHint: "무료: 월 1회 날씨 AI 수정",
  },
};

/** 무료 AI 추가 시 허용 일차 */
export const FREE_AI_ADD_MAX_DAY = 1;

/** 무료 PDF/이미지 워터마크 */
export const FREE_EXPORT_WATERMARK = "Trip Planner · 무료 버전";
