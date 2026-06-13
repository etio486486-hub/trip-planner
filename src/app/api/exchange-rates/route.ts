import { NextResponse } from "next/server";
import { requireProFeature } from "@/lib/pro-server";

type FrankfurterResponse = {
  rates?: Record<string, number>;
};

async function fetchRate(from: string, to: string): Promise<number | null> {
  const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as FrankfurterResponse;
  return data.rates?.[to] ?? null;
}

export async function GET() {
  const auth = await requireProFeature("live_exchange");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [jpyToKrw, usdToKrw] = await Promise.all([
    fetchRate("JPY", "KRW"),
    fetchRate("USD", "KRW"),
  ]);

  if (jpyToKrw == null || usdToKrw == null) {
    return NextResponse.json(
      { error: "환율 API를 불러오지 못했습니다." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    baseCurrency: "KRW",
    toBase: {
      KRW: 1,
      JPY: jpyToKrw,
      USD: usdToKrw,
    },
    fetchedAt: new Date().toISOString(),
    source: "frankfurter.app",
  });
}
