export type TrendingPlace = {
  rank: number;
  name: string;
  region: string;
  tag: string;
  latitude: number;
  longitude: number;
  emoji: string;
};

export const KOREA_TRENDING: Omit<TrendingPlace, "rank">[] = [
  {
    name: "경복궁",
    region: "서울 종로",
    tag: "역사·문화",
    latitude: 37.5796,
    longitude: 126.977,
    emoji: "🏯",
  },
  {
    name: "남산서울타워",
    region: "서울 용산",
    tag: "야경·전망",
    latitude: 37.5512,
    longitude: 126.9882,
    emoji: "🗼",
  },
  {
    name: "해운대 해수욕장",
    region: "부산",
    tag: "바다·휴양",
    latitude: 35.1587,
    longitude: 129.1604,
    emoji: "🏖️",
  },
  {
    name: "성산일출봉",
    region: "제주 서귀포",
    tag: "자연·트레킹",
    latitude: 33.4581,
    longitude: 126.9425,
    emoji: "🌋",
  },
  {
    name: "불국사",
    region: "경주",
    tag: "유네스코",
    latitude: 35.7901,
    longitude: 129.332,
    emoji: "⛩️",
  },
  {
    name: "전주 한옥마을",
    region: "전주",
    tag: "한옥·맛집",
    latitude: 35.8154,
    longitude: 127.153,
    emoji: "🏘️",
  },
  {
    name: "강릉 안목해변",
    region: "강원",
    tag: "카페거리",
    latitude: 37.7733,
    longitude: 128.946,
    emoji: "☕",
  },
  {
    name: "설악산 국립공원",
    region: "강원 속초",
    tag: "등산·단풍",
    latitude: 38.1195,
    longitude: 128.4656,
    emoji: "🍁",
  },
];

export const OVERSEAS_TRENDING: Omit<TrendingPlace, "rank">[] = [
  {
    name: "도쿄 스카이트리",
    region: "일본 도쿄",
    tag: "랜드마크",
    latitude: 35.7101,
    longitude: 139.8107,
    emoji: "🗼",
  },
  {
    name: "후쿠오카 텐진",
    region: "일본 후쿠오카",
    tag: "쇼핑·맛집",
    latitude: 33.5904,
    longitude: 130.4017,
    emoji: "🛍️",
  },
  {
    name: "오사카 도톤보리",
    region: "일본 오사카",
    tag: "먹거리",
    latitude: 34.6687,
    longitude: 135.5013,
    emoji: "🍜",
  },
  {
    name: "에펠탑",
    region: "프랑스 파리",
    tag: "명소",
    latitude: 48.8584,
    longitude: 2.2945,
    emoji: "🥐",
  },
  {
    name: "센트럴 파크",
    region: "미국 뉴욕",
    tag: "도심·공원",
    latitude: 40.7829,
    longitude: -73.9654,
    emoji: "🌳",
  },
  {
    name: "마리나 베이 샌즈",
    region: "싱가포르",
    tag: "야경·호텔",
    latitude: 1.2834,
    longitude: 103.8607,
    emoji: "🌃",
  },
  {
    name: "피사의 사탑",
    region: "이탈리아",
    tag: "유럽 여행",
    latitude: 43.723,
    longitude: 10.3966,
    emoji: "🏛️",
  },
  {
    name: "보라카이 화이트비치",
    region: "필리핀",
    tag: "해변 휴양",
    latitude: 11.9674,
    longitude: 121.9248,
    emoji: "🏝️",
  },
];

export function buildTrendingMapsUrl(place: Pick<TrendingPlace, "name" | "latitude" | "longitude">): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`;
}

export function withRanks(places: Omit<TrendingPlace, "rank">[]): TrendingPlace[] {
  return places.map((place, index) => ({ ...place, rank: index + 1 }));
}
