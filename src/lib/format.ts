import type { ExpenseCurrency } from "./trip-constants";

export function formatMoney(
  amount: number,
  currency: ExpenseCurrency = "JPY"
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  switch (currency) {
    case "JPY":
      return `¥${Math.round(value).toLocaleString("ja-JP")}`;
    case "KRW":
      return `₩${Math.round(value).toLocaleString("ko-KR")}`;
    case "USD":
      return `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    default:
      return `${value.toLocaleString()} ${currency}`;
  }
}

export function formatDateKo(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}월 ${day}일 (${weekdays[d.getDay()]})`;
}
