import { NextResponse } from "next/server";
import { getAuthenticatedProProfile } from "@/lib/pro-server";
import { isProActive } from "@/lib/pro";
import {
  consumeFreemiumUsage,
  getFreemiumUsageSnapshot,
} from "@/lib/freemium-usage-server";

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

export async function GET(request: Request) {
  const { userId, profile } = await getAuthenticatedProProfile();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const isPro = isProActive(profile);
  const url = new URL(request.url);
  const manual = url.searchParams.get("manual") === "1";

  if (!isPro) {
    const snapshot = await getFreemiumUsageSnapshot(
      userId,
      profile,
      "live_exchange"
    );

    if (!snapshot.canUse) {
      return NextResponse.json(
        {
          error:
            manual
              ? "오늘 무료 환율 갱신을 모두 사용했습니다. Pro는 무제한 갱신 가능합니다."
              : "오늘 무료 환율 갱신을 이미 사용했습니다.",
          usage: snapshot,
          limitReached: true,
        },
        { status: manual ? 403 : 429 }
      );
    }

    const consumed = await consumeFreemiumUsage(
      userId,
      profile,
      "live_exchange"
    );
    if (!consumed.ok) {
      return NextResponse.json(
        { error: consumed.error, usage: consumed.snapshot },
        { status: consumed.status }
      );
    }
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
    isPro,
  });
}
