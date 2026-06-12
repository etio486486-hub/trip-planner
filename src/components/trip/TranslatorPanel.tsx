"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Languages,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  speakText,
  stopSpeaking,
  translateText,
  TRANSLATE_LANGS,
  type TranslateLang,
} from "@/lib/translate-client";

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
  const [sourceLang, setSourceLang] = useState<TranslateLang>("ko");
  const [targetLang, setTargetLang] = useState<TranslateLang>("ja");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastTranslatedRef = useRef("");

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognition()));
  }, []);

  const doTranslate = useCallback(
    async (text: string, speak = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);

      try {
        const result = await translateText(trimmed, sourceLang, targetLang);
        setTranslatedText(result);
        lastTranslatedRef.current = result;
        if (speak && autoSpeak) {
          speakText(result, targetLang);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "번역 실패");
      } finally {
        setLoading(false);
      }
    },
    [sourceLang, targetLang, autoSpeak]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterimText("");
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 권장)");
      return;
    }

    stopSpeaking();
    const recognition = new Ctor();
    recognitionRef.current = recognition;

    const langMeta = TRANSLATE_LANGS.find((l) => l.code === sourceLang);
    recognition.lang = langMeta?.speech ?? "ko-KR";
    recognition.continuous = true;
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

    recognition.onerror = () => {
      setListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText("");
    };

    recognition.start();
    setListening(true);
    setError(null);
  }, [sourceLang, doTranslate]);

  const swapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold text-zinc-800">
            실시간 번역기
          </span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          말하면 번역 후 음성으로 들려줍니다 · 일본 여행용
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <div className="mb-3 flex items-center gap-2">
          <LangSelect
            value={sourceLang}
            onChange={setSourceLang}
            disabled={listening}
          />
          <button
            type="button"
            onClick={swapLangs}
            className="shrink-0 rounded-lg p-2 text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50"
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
          rows={3}
          placeholder="말하거나 직접 입력하세요..."
          className="mb-1 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
        />
        {listening && interimText && (
          <p className="mb-2 text-xs italic text-violet-600">
            듣는 중: {interimText}
          </p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {speechSupported ? (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white min-w-[120px] ${
                listening
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              {listening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  듣는 중… 끄기
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  음성 입력
                </>
              )}
            </button>
          ) : (
            <p className="text-xs text-amber-700">
              음성 인식은 Chrome·Edge에서 사용할 수 있습니다.
            </p>
          )}

          <button
            type="button"
            onClick={() => doTranslate(inputText, true)}
            disabled={loading || !inputText.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 min-w-[100px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "번역"
            )}
          </button>
        </div>

        <label className="mb-1 flex items-center justify-between text-xs font-medium text-zinc-600">
          <span>번역 결과</span>
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
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 px-3 py-3">
          <p className="min-h-[3rem] whitespace-pre-wrap text-sm font-medium text-zinc-900">
            {translatedText || (loading ? "번역 중…" : "번역 결과가 여기 표시됩니다")}
          </p>
          {translatedText && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => speakText(translatedText, targetLang)}
                className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                <Volume2 className="h-3.5 w-3.5" />
                다시 듣기
              </button>
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-white"
              >
                <VolumeX className="h-3.5 w-3.5" />
                정지
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500">
          <p className="font-medium text-zinc-600">자주 쓰는 멘트</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              "이거 주세요",
              "계산서 부탁합니다",
              "화장실이 어디예요?",
              "お会計お願いします",
              "トイレはどこですか",
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => {
                  setInputText(phrase);
                  void doTranslate(phrase, true);
                }}
                className="rounded-full bg-white px-2.5 py-1 text-[10px] ring-1 ring-zinc-200 hover:bg-violet-50"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`shrink-0 border-t border-zinc-100 px-3 py-2 text-center text-[10px] text-zinc-400 ${
          isMobile ? "pb-[env(safe-area-inset-bottom)]" : ""
        }`}
      >
        마이크 권한을 허용해 주세요 · 조용한 곳에서 사용하면 정확합니다
      </div>
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
      className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm font-medium"
    >
      {TRANSLATE_LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
