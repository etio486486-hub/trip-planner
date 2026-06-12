export const CHECKLIST_CATEGORIES = [
  "서류·준비",
  "짐 싸기",
  "출발 전",
  "기타",
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];

export const DEFAULT_CHECKLIST_TEMPLATE: {
  category: ChecklistCategory;
  title: string;
}[] = [
  { category: "서류·준비", title: "여권 (유효기간 확인)" },
  { category: "서류·준비", title: "항공권 / e티켓" },
  { category: "서류·준비", title: "숙소 예약 확인" },
  { category: "서류·준비", title: "여행자보험" },
  { category: "서류·준비", title: "eSIM / 로밍 / 와이파이" },
  { category: "서류·준비", title: "현금 · 카드" },
  { category: "짐 싸기", title: "충전기 · 보조배터리" },
  { category: "짐 싸기", title: "멀티어댑터" },
  { category: "짐 싸기", title: "세면도구 · 상비약" },
  { category: "짐 싸기", title: "우산 / 우비" },
  { category: "짐 싸기", title: "옷 · 신발" },
  { category: "출발 전", title: "집 문·창문 잠금" },
  { category: "출발 전", title: "냉장고 정리" },
  { category: "출발 전", title: "쓰레기 비우기" },
];

export const EXPENSE_CATEGORIES = [
  "교통",
  "숙박",
  "식비",
  "쇼핑",
  "관광",
  "통신",
  "기타",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CURRENCIES = [
  { code: "JPY", label: "¥ 엔", symbol: "¥" },
  { code: "KRW", label: "₩ 원", symbol: "₩" },
  { code: "USD", label: "$ 달러", symbol: "$" },
] as const;

export type ExpenseCurrency = (typeof EXPENSE_CURRENCIES)[number]["code"];

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  교통: "bg-sky-100 text-sky-800 ring-sky-200",
  숙박: "bg-violet-100 text-violet-800 ring-violet-200",
  식비: "bg-orange-100 text-orange-800 ring-orange-200",
  쇼핑: "bg-pink-100 text-pink-800 ring-pink-200",
  관광: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  통신: "bg-blue-100 text-blue-800 ring-blue-200",
  기타: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};
