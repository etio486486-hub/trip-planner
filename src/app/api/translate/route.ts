import { NextResponse } from "next/server";

type LangCode = "ko" | "ja" | "en";

const MYMEMORY_LANG: Record<LangCode, string> = {
  ko: "ko-KR",
  ja: "ja-JP",
  en: "en-GB",
};

async function translateWithGoogle(
  text: string,
  source: LangCode,
  target: LangCode,
  apiKey: string
): Promise<string | null> {
  const url = new URL("https://translation.googleapis.com/language/translate/v2");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", text);
  url.searchParams.set("source", source);
  url.searchParams.set("target", target);
  url.searchParams.set("format", "text");

  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    data?: { translations?: { translatedText?: string }[] };
  };
  return data.data?.translations?.[0]?.translatedText ?? null;
}

async function translateWithMyMemory(
  text: string,
  source: LangCode,
  target: LangCode
): Promise<string> {
  const langpair = `${MYMEMORY_LANG[source]}|${MYMEMORY_LANG[target]}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("번역 서버 응답 오류");

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };

  if (data.responseStatus !== 200) {
    throw new Error("번역 할당량 초과 또는 지원하지 않는 언어입니다.");
  }

  const translated = data.responseData?.translatedText?.trim();
  if (!translated) throw new Error("번역 결과가 비어 있습니다.");
  return translated;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      source?: LangCode;
      target?: LangCode;
    };

    const text = body.text?.trim();
    const source = body.source ?? "ko";
    const target = body.target ?? "ja";

    if (!text) {
      return NextResponse.json({ error: "텍스트가 필요합니다." }, { status: 400 });
    }

    if (source === target) {
      return NextResponse.json({ translatedText: text });
    }

    const googleKey =
      process.env.GOOGLE_TRANSLATE_API_KEY ??
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    let translated: string | null = null;
    if (googleKey?.startsWith("AIza")) {
      translated = await translateWithGoogle(text, source, target, googleKey);
    }

    if (!translated) {
      translated = await translateWithMyMemory(text, source, target);
    }

    return NextResponse.json({ translatedText: translated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "번역 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
