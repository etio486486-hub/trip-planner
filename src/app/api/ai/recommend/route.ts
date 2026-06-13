import { NextResponse } from "next/server";
import { getAuthenticatedProProfile } from "@/lib/pro-server";
import { isProActive } from "@/lib/pro";
import {
  consumeFreemiumUsage,
  getFreemiumUsageSnapshot,
} from "@/lib/freemium-usage-server";

type RecommendRequest = {
  destination?: string;
  days?: number;
  preferences?: string;
  existingPlaces?: string[];
};

type AiPlace = {
  name: string;
  memo?: string;
};

type AiDay = {
  dayNumber: number;
  title?: string;
  places: AiPlace[];
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
      "ai_recommend"
    );
    if (!snapshot.canUse) {
      return NextResponse.json(
        {
          error: "무료 AI 추천은 이번 달 1회까지입니다. Pro로 무제한 이용하세요.",
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

  let body: RecommendRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const destination = body.destination?.trim() || "후쿠오카";
  const requestedDays = Math.min(7, Math.max(1, body.days ?? 1));
  const days = isPro ? requestedDays : 1;
  const preferences = body.preferences?.trim() || "맛집·관광·대중교통 접근";
  const existing = body.existingPlaces?.slice(0, 20) ?? [];

  const systemPrompt = `You are a travel itinerary assistant for Korean travelers visiting Japan and nearby destinations.
Return ONLY valid JSON with this shape:
{"days":[{"dayNumber":1,"title":"optional theme","places":[{"name":"place name in local language or Korean","memo":"short tip in Korean"}]}]}
Rules:
- ${days} day(s), 3-4 places per day (not too many)
- Use official place names (Japanese + English when helpful, e.g. "福岡タワー Fukuoka Tower")
- Real, visitable places in ${destination}
- Spread places geographically across the city (not all same area)
- Avoid duplicating: ${existing.join(", ") || "none"}
- Preferences: ${preferences}
- memos in Korean, concise`;

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
          content: `${destination} ${days}일 여행 코스를 추천해 주세요.`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    console.error("[ai/recommend] OpenAI error:", await res.text());
    return NextResponse.json(
      { error: "AI 추천 생성에 실패했습니다." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    return NextResponse.json(
      { error: "AI 응답이 비어 있습니다." },
      { status: 502 }
    );
  }

  try {
    const parsed = JSON.parse(raw) as { days?: AiDay[] };
    const daysResult = (parsed.days ?? []).slice(0, days);

    if (!isPro) {
      const consumed = await consumeFreemiumUsage(
        userId,
        profile,
        "ai_recommend"
      );
      if (!consumed.ok) {
        return NextResponse.json(
          { error: consumed.error },
          { status: consumed.status }
        );
      }
    }

    return NextResponse.json({
      destination,
      days: daysResult,
      freemium: !isPro,
    });
  } catch {
    return NextResponse.json(
      { error: "AI 응답 파싱에 실패했습니다." },
      { status: 502 }
    );
  }
}
