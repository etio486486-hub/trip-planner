import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  verifyAdminPassword,
} from "@/lib/supabase/service";

type ProAction = "grant" | "revoke";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUserId(raw: string): string | null {
  const id = raw.trim();
  if (!id) return "userId required";
  if (id.startsWith("eyJ")) {
    return "JWT 토큰이 입력되었습니다. Supabase service_role 키가 아니라, Auth 사용자 UUID(예: 051b45f6-...)를 입력해 주세요.";
  }
  if (!UUID_RE.test(id)) {
    return "올바른 UUID 형식이 아닙니다. Supabase Dashboard → Authentication → Users 에서 사용자 ID를 복사해 주세요.";
  }
  return null;
}

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

  const userIdError = validateUserId(userId);
  if (userIdError) {
    return NextResponse.json({ error: userIdError }, { status: 400 });
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
