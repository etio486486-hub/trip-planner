"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Languages,
  Loader2,
  Mic,
  MicOff,
  MessageSquareText,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  getDeviceSpeechSupport,
  requestMicrophonePermission,
  type DeviceSpeechSupport,
} from "@/lib/translator-device";
import {
  fetchKoreanReading,
  speakText,
  stopSpeaking,
  translateText,
  TRANSLATE_LANGS,
  type TranslateLang,
} from "@/lib/translate-client";
import { getLocalKoreanReading } from "@/lib/foreign-reading";
import { COMMON_PHRASES } from "@/lib/common-phrases";
import { usePro } from "@/hooks/usePro";
import { ConversationTranslator } from "@/components/pro/ConversationTranslator";
import { ProBadge } from "@/components/pro/ProBadge";
import { ProUpgradePanel } from "@/components/pro/ProUpgradePanel";

type TranslatorMode = "basic" | "conversation";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function TranslatorPanel({ isMobile = false }: { isMobile?: boolean }) {
  const { hasFeature } = usePro();
  const [mode, setMode] = useState<TranslatorMode>("basic");
  const canConversation = hasFeature("conversation_mode");
  const [sourceLang, setSourceLang] = useState<TranslateLang>("ko");
  const [targetLang, setTargetLang] = useState<TranslateLang>("ja");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [readingKo, setReadingKo] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceSpeechSupport | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wantListenRef = useRef(false);

  useEffect(() => {
    setDevice(getDeviceSpeechSupport());
  }, []);

  const doTranslate = useCallback(
    async (text: string, speak = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);

      try {
        const result = await translateText(trimmed, sourceLang, targetLang);
        setTranslatedText(result.translatedText);

        let reading = result.readingKo;
        if (!reading && targetLang !== "ko") {
          reading = getLocalKoreanReading(result.translatedText, targetLang);
        }
        if (!reading && targetLang !== "ko") {
          reading = await fetchKoreanReading(
            result.translatedText,
            targetLang === "en" ? "en" : "ja"
          );
        }
        setReadingKo(reading);

        if (speak && autoSpeak && device?.synthesis !== false) {
          await speakText(result.translatedText, targetLang);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "번역 실패");
      } finally {
        setLoading(false);
      }
    },
    [sourceLang, targetLang, autoSpeak, device?.synthesis]
  );

  const stopListening = useCallback(() => {
    wantListenRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
    setInterimText("");
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || !wantListenRef.current) return;

    const recognition = new Ctor();
    recognitionRef.current = recognition;

    const langMeta = TRANSLATE_LANGS.find((l) => l.code === sourceLang);
    recognition.lang = langMeta?.speech ?? "ko-KR";
    // 모바일에서는 continuous=false가 더 안정적
    recognition.continuous = !device?.isMobile;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);

      if (finalText.trim()) {
        setInputText((prev) => {
          const next = prev ? `${prev} ${finalText.trim()}` : finalText.trim();
          return next;
        });
        void doTranslate(finalText.trim(), true);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error;
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError("마이크 권한을 허용해 주세요. (설정 → Safari/Chrome → 마이크)");
        wantListenRef.current = false;
      } else if (code !== "aborted" && code !== "no-speech") {
        setError(`음성 인식 오류: ${code}`);
      }
      setListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      if (wantListenRef.current) {
        // Android: 짧게 끊기면 자동 재시작
        window.setTimeout(() => startRecognition(), 300);
      } else {
        setListening(false);
        setInterimText("");
      }
    };

    try {
      recognition.start();
      setListening(true);
      setError(null);
    } catch {
      wantListenRef.current = false;
      setListening(false);
      setError("음성 인식을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    }
  }, [sourceLang, doTranslate, device?.isMobile]);

  const startListening = useCallback(async () => {
    if (!device?.recognition) {
      setError(
        device?.isIOS
          ? "iPhone/iPad Safari는 음성 입력을 지원하지 않습니다. 아래 문장을 누르거나 직접 입력해 주세요."
          : "이 브라우저는 음성 인식을 지원하지 않습니다."
      );
      return;
    }

    stopSpeaking();
    const permitted = await requestMicrophonePermission();
    if (!permitted) {
      setError("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
      return;
    }

    wantListenRef.current = true;
    startRecognition();
  }, [device, startRecognition]);

  useEffect(() => {
    return () => {
      wantListenRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  const swapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setReadingKo(null);
  };

  const showVoiceButton = device?.recognition;

  if (mode === "conversation") {
    if (canConversation) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
            <ModeTabs mode={mode} onModeChange={setMode} />
          </div>
          <ConversationTranslator isMobile={isMobile} />
        </div>
      );
    }
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
        <ModeTabs mode={mode} onModeChange={setMode} />
        <ProUpgradePanel featureId="conversation_mode" className="mt-3" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
        <ModeTabs mode={mode} onModeChange={setMode} />
        <div className="mt-2 flex items-center gap-2">
          <Languages className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold text-zinc-800">
            실시간 번역기
          </span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          {device?.textOnlyMode
            ? "문장을 누르거나 입력 → 번역 · 큰 글씨로 보여주기 (iPhone)"
            : "말하면 번역 후 음성으로 들려줍니다 · 일본 여행용"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        {device?.isIOS && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
            📱 iPhone은 음성 <strong>입력</strong>이 안 됩니다. 자주 쓰는 문장
            버튼이나 키보드 입력 후 <strong>번역 · 다시 듣기</strong>를
            사용하세요. (음성 출력은 가능)
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <LangSelect
            value={sourceLang}
            onChange={setSourceLang}
            disabled={listening}
          />
          <button
            type="button"
            onClick={swapLangs}
            className="shrink-0 rounded-lg p-2.5 text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="언어 바꾸기"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <LangSelect
            value={targetLang}
            onChange={setTargetLang}
            disabled={listening}
          />
        </div>

        <label className="mb-1 block text-xs font-medium text-zinc-600">
          입력
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={isMobile ? 2 : 3}
          placeholder={
            device?.textOnlyMode
              ? "일본어/한국어 입력 후 번역 버튼..."
              : "말하거나 직접 입력하세요..."
          }
          className="mb-1 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2.5 text-base sm:text-sm"
        />
        {listening && interimText && (
          <p className="mb-2 text-xs italic text-violet-600">
            듣는 중: {interimText}
          </p>
        )}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {showVoiceButton ? (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-white min-h-[48px] ${
                listening
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              {listening ? (
                <>
                  <MicOff className="h-5 w-5" />
                  듣는 중… 끄기
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  음성 입력
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-xs text-zinc-600 min-h-[48px]">
              <MessageSquareText className="h-4 w-4 shrink-0" />
              {device?.isIOS
                ? "iPhone: 문장 버튼 · 키보드 입력 사용"
                : "음성 입력 미지원 · 텍스트로 번역"}
            </div>
          )}

          <button
            type="button"
            onClick={() => doTranslate(inputText, true)}
            disabled={loading || !inputText.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 min-h-[48px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "번역"
            )}
          </button>
        </div>

        <label className="mb-1 flex items-center justify-between text-xs font-medium text-zinc-600">
          <span>번역 결과 {isMobile ? "(큰 글씨)" : ""}</span>
          <label className="flex items-center gap-1.5 font-normal text-zinc-500">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="rounded"
            />
            자동 읽기
          </label>
        </label>
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 px-3 py-4">
          <p
            className={`min-h-[3rem] whitespace-pre-wrap font-semibold text-zinc-900 ${
              isMobile ? "text-lg leading-relaxed" : "text-sm"
            }`}
          >
            {translatedText ||
              (loading ? "번역 중…" : "번역 결과가 여기 표시됩니다")}
          </p>
          {readingKo && targetLang !== "ko" && (
            <p
              className={`mt-2 font-medium text-violet-700 ${
                isMobile ? "text-base leading-relaxed" : "text-sm"
              }`}
            >
              <span className="text-violet-500">읽기 · </span>
              {readingKo}
            </p>
          )}
          {translatedText && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => speakText(translatedText, targetLang)}
                className="flex min-h-[44px] items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                <Volume2 className="h-4 w-4" />
                다시 듣기
              </button>
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex min-h-[44px] items-center gap-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-white"
              >
                <VolumeX className="h-4 w-4" />
                정지
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-3">
          <p className="text-xs font-semibold text-zinc-700">
            {device?.isIOS ? "👆 탭하면 바로 번역·읽기" : "자주 쓰는 멘트"}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COMMON_PHRASES.map(({ ko, ja, jaReading }) => {
              const phrase = targetLang === "ja" ? ja : ko;
              const src = targetLang === "ja" ? ko : ja;
              const phraseReading =
                targetLang === "ja"
                  ? jaReading
                  : targetLang === "en"
                    ? getLocalKoreanReading(phrase, "en")
                    : null;
              return (
                <button
                  key={ko}
                  type="button"
                  onClick={() => {
                    setInputText(src);
                    void doTranslate(src, true);
                  }}
                  className="rounded-xl bg-white px-3 py-3 text-left ring-1 ring-zinc-200 active:bg-violet-50 min-h-[52px]"
                >
                  <span className="block text-xs text-zinc-500">{src}</span>
                  <span className="mt-0.5 block text-sm font-medium text-zinc-900">
                    → {phrase}
                  </span>
                  {phraseReading && (
                    <span className="mt-0.5 block text-xs text-violet-600">
                      읽기 · {phraseReading}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={`shrink-0 border-t border-zinc-100 px-3 py-2 text-center text-[10px] text-zinc-400 ${
          isMobile ? "pb-[max(0.5rem,env(safe-area-inset-bottom))]" : ""
        }`}
      >
        {device?.recognition
          ? "마이크 권한 허용 · Android Chrome 권장"
          : "텍스트 번역 + 음성 듣기 · Pro 대화형 모드 이용 가능"}
      </div>
    </div>
  );
}

function ModeTabs({
  mode,
  onModeChange,
}: {
  mode: TranslatorMode;
  onModeChange: (m: TranslatorMode) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
      <button
        type="button"
        onClick={() => onModeChange("basic")}
        className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
          mode === "basic"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        기본 번역
      </button>
      <button
        type="button"
        onClick={() => onModeChange("conversation")}
        className={`flex flex-1 items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold transition-colors ${
          mode === "conversation"
            ? "bg-white text-violet-700 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        대화형
        <ProBadge />
      </button>
    </div>
  );
}

function LangSelect({
  value,
  onChange,
  disabled,
}: {
  value: TranslateLang;
  onChange: (v: TranslateLang) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TranslateLang)}
      disabled={disabled}
      className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-2.5 text-sm font-medium"
    >
      {TRANSLATE_LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
