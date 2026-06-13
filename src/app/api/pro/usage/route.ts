import { NextResponse } from "next/server";
import { getAuthenticatedProProfile } from "@/lib/pro-server";
import { isProActive } from "@/lib/pro";
import {
  consumeFreemiumUsage,
  getAllFreemiumUsage,
} from "@/lib/freemium-usage-server";
import type { FreemiumFeatureId } from "@/lib/freemium-limits";

export async function GET() {
  const { userId, profile } = await getAuthenticatedProProfile();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const usage = await getAllFreemiumUsage(userId, profile);

  return NextResponse.json({
    isPro: isProActive(profile),
    usage: Object.fromEntries(usage.map((u) => [u.featureId, u])),
  });
}

export async function POST(request: Request) {
  const { userId, profile } = await getAuthenticatedProProfile();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { featureId?: FreemiumFeatureId };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const featureId = body.featureId;
  if (
    !featureId ||
    !["ai_recommend", "conversation_mode", "live_exchange", "weather_ai_reschedule"].includes(
      featureId
    )
  ) {
    return NextResponse.json({ error: "Invalid featureId" }, { status: 400 });
  }

  const result = await consumeFreemiumUsage(userId, profile, featureId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, usage: result.snapshot },
      { status: result.status }
    );
  }

  return NextResponse.json({ usage: result.snapshot });
}
