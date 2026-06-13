export type DeviceSpeechSupport = {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  recognition: boolean;
  synthesis: boolean;
  /** iOS Safari 등 — 텍스트 번역 + TTS만 가능 */
  textOnlyMode: boolean;
};

export function getDeviceSpeechSupport(): DeviceSpeechSupport {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      recognition: false,
      synthesis: false,
      textOnlyMode: true,
    };
  }

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile/i.test(ua);

  const w = window as Window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  const recognition = Boolean(
    w.SpeechRecognition ?? w.webkitSpeechRecognition
  );

  const synthesis = "speechSynthesis" in window;

  // iOS 모든 브라우저(WebKit)는 SpeechRecognition 미지원
  const textOnlyMode = isIOS || !recognition;

  return {
    isMobile,
    isIOS,
    isAndroid,
    recognition: recognition && !isIOS,
    synthesis,
    textOnlyMode,
  };
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export function pickSpeechVoice(langPrefix: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.replace("_", "-").startsWith(langPrefix)) ??
    voices.find((v) => v.lang.startsWith(langPrefix.split("-")[0])) ??
    null
  );
}
