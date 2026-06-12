export type TranslateLang = "ko" | "ja" | "en";

export const TRANSLATE_LANGS: {
  code: TranslateLang;
  label: string;
  speech: string;
  flag: string;
}[] = [
  { code: "ko", label: "한국어", speech: "ko-KR", flag: "🇰🇷" },
  { code: "ja", label: "日本語", speech: "ja-JP", flag: "🇯🇵" },
  { code: "en", label: "English", speech: "en-US", flag: "🇺🇸" },
];

export async function translateText(
  text: string,
  source: TranslateLang,
  target: TranslateLang
): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, target }),
  });

  const data = (await res.json()) as {
    translatedText?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "번역 실패");
  }

  return data.translatedText ?? "";
}

export function speakText(text: string, lang: TranslateLang): void {
  if (typeof window === "undefined" || !text.trim()) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const meta = TRANSLATE_LANGS.find((l) => l.code === lang);
  utterance.lang = meta?.speech ?? "ko-KR";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}
