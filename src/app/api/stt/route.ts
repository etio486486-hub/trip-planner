import { NextResponse } from "next/server";
import { requireProFeature } from "@/lib/pro-server";

const WHISPER_LANG: Record<string, string> = {
  ko: "ko",
  ja: "ja",
  en: "en",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request) {
  const auth = await requireProFeature("iphone_stt");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY가 설정되지 않았습니다. Vercel 환경 변수에 추가해 주세요.",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audio = formData.get("audio");
  const langRaw = String(formData.get("lang") ?? "ko");
  const language = WHISPER_LANG[langRaw] ?? "ko";

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "오디오 파일이 없습니다." }, { status: 400 });
  }

  if (audio.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "녹음이 너무 깁니다. 30초 이내로 다시 시도해 주세요." },
      { status: 400 }
    );
  }

  const whisperForm = new FormData();
  const type = audio.type || "audio/webm";
  const ext = type.includes("mp4") || type.includes("aac") ? "m4a" : "webm";
  whisperForm.append("file", audio, `recording.${ext}`);
  whisperForm.append("model", "whisper-1");
  whisperForm.append("language", language);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: whisperForm,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[stt] Whisper error:", res.status, errText);
    return NextResponse.json(
      { error: "음성 인식에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json(
      { error: "인식된 내용이 없습니다. 다시 말해 주세요." },
      { status: 422 }
    );
  }

  return NextResponse.json({ text });
}
