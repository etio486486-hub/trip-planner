import type { TranslateLang } from "@/lib/translate-client";

const WHISPER_LANG: Record<TranslateLang, string> = {
  ko: "ko",
  ja: "ja",
  en: "en",
};

export function getPreferredAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/aac",
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }

  return "";
}

export function isServerSttSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(getPreferredAudioMimeType())
  );
}

export async function transcribeAudio(
  blob: Blob,
  lang: TranslateLang
): Promise<string> {
  const formData = new FormData();
  const type = blob.type || getPreferredAudioMimeType() || "audio/webm";
  const ext =
    type.includes("mp4") || type.includes("aac") || type.includes("m4a")
      ? "m4a"
      : "webm";

  formData.append("audio", blob, `recording.${ext}`);
  formData.append("lang", WHISPER_LANG[lang]);

  const res = await fetch("/api/stt", { method: "POST", body: formData });
  const data = (await res.json()) as { text?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "음성 인식 실패");
  }

  return data.text?.trim() ?? "";
}
