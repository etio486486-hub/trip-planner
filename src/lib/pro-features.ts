export type ProFeatureId =
  | "conversation_mode"
  | "iphone_stt"
  | "pdf_export"
  | "unlimited_trips"
  | "live_exchange"
  | "ai_recommend"
  | "offline_pack"
  | "weather_ai_reschedule"
  | "vote_mode";

export type ProFeatureDef = {
  id: ProFeatureId;
  name: string;
  description: string;
  tier: 1 | 2;
  /** 구현 완료 여부 */
  implemented: boolean;
};

/** Pro 로드맵 — 하나씩 implemented: true 로 전환 */
export const PRO_FEATURES: ProFeatureDef[] = [
  {
    id: "conversation_mode",
    name: "대화형 통역 모드",
    description:
      "화면을 나눠 큰 글씨로 번역을 보여주고, 자동 음성 재생. 가게·택시에서 바로 보여주기.",
    tier: 1,
    implemented: true,
  },
  {
    id: "iphone_stt",
    name: "iPhone 음성 입력",
    description:
      "iPhone Safari에서도 말하면 번역. 서버 STT(Whisper) 연동.",
    tier: 1,
    implemented: true,
  },
  {
    id: "pdf_export",
    name: "PDF·이미지 내보내기",
    description: "일정·가계부·체크리스트를 PDF 또는 이미지로 저장·공유.",
    tier: 1,
    implemented: true,
  },
  {
    id: "unlimited_trips",
    name: "무제한 여행",
    description: "무료 3개 제한 없이 여행을 원하는 만큼 생성.",
    tier: 1,
    implemented: true,
  },
  {
    id: "offline_pack",
    name: "오프라인 팩",
    description:
      "일정·좌표·통역 문장을 HTML로 저장. Wi-Fi 없는 지하철·외곽에서도 열람.",
    tier: 1,
    implemented: true,
  },
  {
    id: "vote_mode",
    name: "투표 모드",
    description:
      "맛집·일정 후보를 멤버에게 투표. 다수결로 함께 결정.",
    tier: 1,
    implemented: true,
  },
  {
    id: "live_exchange",
    name: "실시간 환율",
    description: "가계부 환율을 API로 자동 갱신, 일별 원화 합계.",
    tier: 2,
    implemented: true,
  },
  {
    id: "ai_recommend",
    name: "AI 일정·맛집 추천",
    description: "여행지·취향에 맞춘 AI 코스·맛집 제안.",
    tier: 2,
    implemented: true,
  },
  {
    id: "weather_ai_reschedule",
    name: "날씨 연동 AI 일정 수정",
    description:
      "예보를 반영해 비·더위에 맞게 실내/실외 코스를 AI가 재제안.",
    tier: 2,
    implemented: true,
  },
];

export const PRO_PRICE_LABEL = "월 4,900원";
export const FREE_TRIP_LIMIT = 3;

/** 무료 맛보기 안내 */
export const FREEMIUM_TEASERS: Partial<Record<ProFeatureId, string>> = {
  ai_recommend: "무료: 월 1회 · 1일치 · Pro: 무제한",
  conversation_mode: "무료: 미리보기 3회 · Pro: 무제한",
  pdf_export: "무료: 일정 PDF·이미지(워터마크) · Pro: 가계부·체크리스트 포함",
  live_exchange: "무료: 하루 1회 자동 갱신 · Pro: 무제한 + 일별 원화",
  offline_pack: "무료: 1일치 미리보기 · Pro: 전체 일정+통역문장",
  weather_ai_reschedule: "무료: 월 1회 · Pro: 무제한",
  vote_mode: "무료: 투표 참여 · Pro: 투표 만들기",
};

export function getProFeature(id: ProFeatureId): ProFeatureDef | undefined {
  return PRO_FEATURES.find((f) => f.id === id);
}
