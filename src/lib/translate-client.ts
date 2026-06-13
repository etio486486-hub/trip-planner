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

let voicesReady = false;

function ensureVoicesLoaded(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }
  if (voicesReady && window.speechSynthesis.getVoices().length > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const finish = () => {
      voicesReady = true;
      resolve();
    };

    if (synth.getVoices().length > 0) {
      finish();
      return;
    }

    synth.onvoiceschanged = () => {
      synth.onvoiceschanged = null;
      finish();
    };

    setTimeout(finish, 500);
  });
}

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

export async function speakText(
  text: string,
  lang: TranslateLang
): Promise<void> {
  if (typeof window === "undefined" || !text.trim()) return;

  await ensureVoicesLoaded();

  const synth = window.speechSynthesis;
  synth.cancel();

  const meta = TRANSLATE_LANGS.find((l) => l.code === lang);
  const langCode = meta?.speech ?? "ko-KR";
  const langPrefix = langCode.split("-")[0];

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.92;

  const voices = synth.getVoices();
  const voice =
    voices.find((v) => v.lang.replace("_", "-").startsWith(langCode)) ??
    voices.find((v) => v.lang.startsWith(langPrefix));
  if (voice) utterance.voice = voice;

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);

    // iOS Safari: speak가 끊기는 경우 재시작
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const resume = setInterval(() => {
        if (!synth.speaking) {
          clearInterval(resume);
          resolve();
        } else {
          synth.pause();
          synth.resume();
        }
      }, 8000);
      utterance.onend = () => {
        clearInterval(resume);
        resolve();
      };
    }
  });
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}

// speakText async로 바뀌었으므로 void 호출 호환
export function speakTextSync(text: string, lang: TranslateLang): void {
  void speakText(text, lang);
}
