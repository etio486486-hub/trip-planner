const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** URL 또는 UUID에서 tripId·code 추출 */
export function parseTripJoinInput(raw: string): {
  tripId: string | null;
  code: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { tripId: null, code: null };

  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "https://placeholder.local");

    const pathMatch = url.pathname.match(
      /\/trips\/([0-9a-f-]{36})/i
    );
    const tripId = pathMatch?.[1] ?? null;
    const code =
      url.searchParams.get("code") ??
      url.searchParams.get("invite") ??
      null;
    return { tripId, code: code ? normalizeInviteCode(code) : null };
  } catch {
    /* not a url */
  }

  const uuidMatch = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  if (uuidMatch) {
    return { tripId: uuidMatch[0], code: null };
  }

  if (/^[A-Z0-9]{4,12}$/i.test(trimmed.replace(/\s/g, ""))) {
    return { tripId: null, code: normalizeInviteCode(trimmed) };
  }

  return { tripId: null, code: null };
}
