/** Supabase/PostgREST 에러에서 메시지 추출 */
export function getSupabaseErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return String(err);
}

/** 테이블이 아직 생성되지 않았을 때 (404 / PGRST205 / 42P01) */
export function isMissingTableError(err: unknown, tableName?: string): boolean {
  const msg = getSupabaseErrorMessage(err).toLowerCase();
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";

  if (code === "PGRST205" || code === "42P01") return true;

  if (
    msg.includes("could not find the table") ||
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("404")
  ) {
    if (!tableName) return true;
    return msg.includes(tableName.toLowerCase());
  }

  return false;
}
