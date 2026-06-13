import { NextResponse } from "next/server";
import { fetchKoreanReadingFromText } from "@/lib/translate-reading-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      lang?: "ja" | "en";
    };
    const text = body.text?.trim();
    const lang = body.lang ?? "ja";

    if (!text) {
      return NextResponse.json({ error: "텍스트가 필요합니다." }, { status: 400 });
    }

    const readingKo = await fetchKoreanReadingFromText(text, lang);

    return NextResponse.json({ readingKo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "발음 변환 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
