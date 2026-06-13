import { NextResponse } from "next/server";
import { getAuthenticatedProProfile } from "@/lib/pro-server";
import { isProActive } from "@/lib/pro";
import {
  consumeFreemiumUsage,
  getFreemiumUsageSnapshot,
} from "@/lib/freemium-usage-server";

type WeatherRescheduleRequest = {
  destination?: string;
  dayNumber?: number;
  dayDate?: string;
  weather?: {
    date: string;
    weatherLabel: string;
    precipMm: number;
    tempMaxC: number;
    isRainy: boolean;
  };
  places?: Array<{ name: string; memo?: string | null }>;
};

export async function POST(request: Request) {
  const { userId, profile } = await getAuthenticatedProProfile();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const isPro = isProActive(profile);

  if (!isPro) {
    const snapshot = await getFreemiumUsageSnapshot(
      userId,
      profile,
      "weather_ai_reschedule"
    );
    if (!snapshot.canUse) {
      return NextResponse.json(
        {
          error:
            "무료 날씨 AI 수정은 이번 달 1회까지입니다. Pro로 무제한 이용하세요.",
          usage: snapshot,
        },
        { status: 403 }
      );
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  let body: WeatherRescheduleRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const destination = body.destination?.trim() || "여행지";
  const dayNumber = body.dayNumber ?? 1;
  const weather = body.weather;
  const places = body.places?.slice(0, 12) ?? [];

  if (!weather || places.length === 0) {
    return NextResponse.json(
      { error: "날씨 정보와 일정 장소가 필요합니다." },
      { status: 400 }
    );
  }

  const systemPrompt = `You are a travel assistant for Korean travelers in Japan.
Return ONLY valid JSON:
{"summary":"한 줄 요약","tips":["조언1","조언2"],"swaps":[{"from":"기존 장소","to":"대체 장소","reason":"이유"}],"reorder":["장소1","장소2"]}
Rules:
- Consider weather: ${weather.weatherLabel}, rain ${weather.precipMm}mm, max ${weather.tempMaxC}°C
- If rainy: prefer indoor, suggest 1-3 swaps max
- reorder: suggested visit order for the day (use existing place names when possible)
- tips: 2-4 practical Korean tips
- Real places in ${destination} when suggesting swaps`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${destination} ${dayNumber}일차 (${weather.date}) 일정:\n${places.map((p, i) => `${i + 1}. ${p.name}${p.memo ? ` — ${p.memo}` : ""}`).join("\n")}`,
        },
      ],
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    console.error("[ai/weather-reschedule]", await res.text());
    return NextResponse.json(
      { error: "AI 일정 수정 생성에 실패했습니다." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    return NextResponse.json({ error: "AI 응답이 비어 있습니다." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(raw) as {
      summary?: string;
      tips?: string[];
      swaps?: Array<{ from: string; to: string; reason: string }>;
      reorder?: string[];
    };

    if (!isPro) {
      const consumed = await consumeFreemiumUsage(
        userId,
        profile,
        "weather_ai_reschedule"
      );
      if (!consumed.ok) {
        return NextResponse.json(
          { error: consumed.error },
          { status: consumed.status }
        );
      }
    }

    return NextResponse.json({
      dayNumber,
      weather,
      summary: parsed.summary ?? "",
      tips: parsed.tips ?? [],
      swaps: parsed.swaps ?? [],
      reorder: parsed.reorder ?? [],
      freemium: !isPro,
    });
  } catch {
    return NextResponse.json(
      { error: "AI 응답 파싱에 실패했습니다." },
      { status: 502 }
    );
  }
}
