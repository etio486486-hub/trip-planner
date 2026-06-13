import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  verifyAdminPassword,
} from "@/lib/supabase/service";

type ProAction = "grant" | "revoke";

export async function POST(request: Request) {
  let body: {
    password?: string;
    userId?: string;
    action?: ProAction;
    months?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { password, userId, action = "grant", months = 1 } = body;

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId?.trim()) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. Vercel 환경 변수에 추가해 주세요.",
      },
      { status: 503 }
    );
  }

  const now = new Date();
  let isPro = false;
  let proUntil: string | null = null;

  if (action === "grant") {
    isPro = true;
    const until = new Date(now);
    until.setMonth(until.getMonth() + Math.max(1, months));
    proUntil = until.toISOString();
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId.trim(),
        is_pro: isPro,
        pro_until: proUntil,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id, is_pro, pro_until")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
