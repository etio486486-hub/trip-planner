export type CommonPhrase = {
  ko: string;
  ja: string;
  /** 일본어 → 한국어 발음 (여행용) */
  jaReading: string;
};

export const COMMON_PHRASES: CommonPhrase[] = [
  {
    ko: "이거 주세요",
    ja: "これください",
    jaReading: "코레쿠다사이",
  },
  {
    ko: "계산서 부탁합니다",
    ja: "お会計お願いします",
    jaReading: "오카이케이오네가이시마스",
  },
  {
    ko: "화장실이 어디예요?",
    ja: "トイレはどこですか",
    jaReading: "토이레와도코데스카",
  },
  {
    ko: "물 한 잔 주세요",
    ja: "お水ください",
    jaReading: "오미즈쿠다사이",
  },
  {
    ko: "맵게 해 주세요",
    ja: "辛くしないでください",
    jaReading: "카라쿠시나이데쿠다사이",
  },
  {
    ko: "사진 찍어도 되나요?",
    ja: "写真撮ってもいいですか",
    jaReading: "샤신톳테모이이데스카",
  },
];
