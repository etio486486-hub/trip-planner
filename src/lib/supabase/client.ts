import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;

const PLACEHOLDER_PATTERNS = [
  "your-project.supabase.co",
  "your_supabase_anon_key",
  "your_google_maps_api_key",
  "xxx.supabase.co",
  "여기에-anon-키-붙여넣기",
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase())
  );
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(url && key && !isPlaceholder(url) && !isPlaceholder(key));
}

export function getSupabaseSetupMessage(): string {
  if (isSupabaseConfigured()) return "";

  return [
    "Supabase 연결 정보가 필요합니다.",
    "1. https://supabase.com 에서 프로젝트 생성",
    "2. Settings → API 에서 Project URL, anon key 복사",
    "3. Publishable key(sb_publishable_...)를 .env.local에 넣고 서버 재시작",
    "4. SQL Editor에서 supabase/schema.sql 실행",
  ].join("\n");
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요."
    );
  }

  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return client;
}
