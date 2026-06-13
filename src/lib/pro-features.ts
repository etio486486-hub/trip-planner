export type ProFeatureId =
  | "conversation_mode"
  | "iphone_stt"
  | "pdf_export"
  | "unlimited_trips"
  | "live_exchange"
  | "ai_recommend";

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
    implemented: false,
  },
  {
    id: "pdf_export",
    name: "PDF·이미지 내보내기",
    description: "일정·가계부·체크리스트를 PDF 또는 이미지로 저장·공유.",
    tier: 1,
    implemented: false,
  },
  {
    id: "unlimited_trips",
    name: "무제한 여행",
    description: "무료 3개 제한 없이 여행을 원하는 만큼 생성.",
    tier: 1,
    implemented: false,
  },
  {
    id: "live_exchange",
    name: "실시간 환율",
    description: "가계부 환율을 API로 자동 갱신, 일별 원화 합계.",
    tier: 2,
    implemented: false,
  },
  {
    id: "ai_recommend",
    name: "AI 일정·맛집 추천",
    description: "여행지·취향에 맞춘 AI 코스·맛집 제안.",
    tier: 2,
    implemented: false,
  },
];

export const PRO_PRICE_LABEL = "월 4,900원";
export const FREE_TRIP_LIMIT = 3;

export function getProFeature(id: ProFeatureId): ProFeatureDef | undefined {
  return PRO_FEATURES.find((f) => f.id === id);
}
