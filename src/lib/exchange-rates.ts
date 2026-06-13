import type { ExpenseCurrency } from "./trip-constants";

export type BaseCurrency = ExpenseCurrency;

export type TripExchangeRates = {
  baseCurrency: BaseCurrency;
  /** 1 단위 해당 통화 = ? 기준통화 */
  toBase: Record<ExpenseCurrency, number>;
  fetchedAt?: string | null;
  liveSource?: string | null;
};

const STORAGE_KEY = "trip-planner-exchange-rates";

const DEFAULT_RATES: TripExchangeRates = {
  baseCurrency: "KRW",
  toBase: {
    KRW: 1,
    JPY: 9.2,
    USD: 1380,
  },
};

function storageKey(tripId: string) {
  return `${STORAGE_KEY}:${tripId}`;
}

export function loadExchangeRates(tripId: string): TripExchangeRates {
  if (typeof window === "undefined") return DEFAULT_RATES;
  try {
    const raw = localStorage.getItem(storageKey(tripId));
    if (!raw) return DEFAULT_RATES;
    const parsed = JSON.parse(raw) as Partial<TripExchangeRates>;
    return {
      baseCurrency: parsed.baseCurrency ?? DEFAULT_RATES.baseCurrency,
      toBase: {
        KRW: parsed.toBase?.KRW ?? DEFAULT_RATES.toBase.KRW,
        JPY: parsed.toBase?.JPY ?? DEFAULT_RATES.toBase.JPY,
        USD: parsed.toBase?.USD ?? DEFAULT_RATES.toBase.USD,
      },
      fetchedAt: parsed.fetchedAt ?? null,
      liveSource: parsed.liveSource ?? null,
    };
  } catch {
    return DEFAULT_RATES;
  }
}

export function saveExchangeRates(
  tripId: string,
  rates: TripExchangeRates
): void {
  try {
    localStorage.setItem(storageKey(tripId), JSON.stringify(rates));
  } catch {
    /* ignore */
  }
}

export function convertToBase(
  amount: number,
  currency: ExpenseCurrency,
  rates: TripExchangeRates
): number {
  const factor = rates.toBase[currency] ?? 1;
  return amount * factor;
}

export function formatBaseHint(
  amount: number,
  currency: ExpenseCurrency,
  rates: TripExchangeRates
): string | null {
  if (currency === rates.baseCurrency) return null;
  const converted = convertToBase(amount, currency, rates);
  const symbol =
    rates.baseCurrency === "KRW"
      ? "₩"
      : rates.baseCurrency === "JPY"
        ? "¥"
        : "$";
  const rounded =
    rates.baseCurrency === "JPY"
      ? Math.round(converted)
      : Math.round(converted);
  return `≈ ${symbol}${rounded.toLocaleString()}`;
}
