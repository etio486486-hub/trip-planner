"use client";

import { useCallback, useState } from "react";
import { ArrowUpDown, Loader2, Volume2 } from "lucide-react";
import { speakText, translateText } from "@/lib/translate-client";
import { getLocalKoreanReading } from "@/lib/foreign-reading";
import { fetchKoreanReading } from "@/lib/translate-client";

type ConversationTranslatorProps = {
  isMobile?: boolean;
};

export function ConversationTranslator({
  isMobile = false,
}: ConversationTranslatorProps) {
  const [koInput, setKoInput] = useState("");
  const [jaInput, setJaInput] = useState("");
  const [koDisplay, setKoDisplay] = useState("");
  const [jaDisplay, setJaDisplay] = useState("");
  const [koReading, setKoReading] = useState<string | null>(null);
  const [loadingKo, setLoadingKo] = useState(false);
  const [loadingJa, setLoadingJa] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const translateKoToJa = useCallback(async () => {
    const text = koInput.trim();
    if (!text) return;
    setLoadingKo(true);
    try {
      const result = await translateText(text, "ko", "ja");
      setJaDisplay(result.translatedText);
      setKoDisplay(text);
      let reading = result.readingKo ?? getLocalKoreanReading(result.translatedText, "ja");
      if (!reading) {
        reading = await fetchKoreanReading(result.translatedText, "ja");
      }
      setKoReading(reading);
      if (autoSpeak) await speakText(result.translatedText, "ja");
    } finally {
      setLoadingKo(false);
    }
  }, [koInput, autoSpeak]);

  const translateJaToKo = useCallback(async () => {
    const text = jaInput.trim();
    if (!text) return;
    setLoadingJa(true);
    try {
      const result = await translateText(text, "ja", "ko");
      setKoDisplay(result.translatedText);
      setJaDisplay(text);
      setKoReading(null);
      if (autoSpeak) await speakText(result.translatedText, "ko");
    } finally {
      setLoadingJa(false);
    }
  }, [jaInput, autoSpeak]);

  const displaySize = isMobile ? "text-2xl" : "text-xl";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-violet-100 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
        <p className="text-sm font-semibold">대화형 통역 모드</p>
        <p className="mt-0.5 text-[11px] text-white/80">
          큰 글씨로 보여주고 · 자동으로 읽어줍니다 · Pro
        </p>
        <label className="mt-2 flex items-center gap-2 text-[11px] text-white/90">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
            className="rounded"
          />
          번역 후 자동 읽기
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col divide-y divide-zinc-200">
        {/* 한국어 → 일본어 (위: 내가 말함, 아래: 상대에게 보여줄 큰 글씨) */}
        <div className="flex min-h-0 flex-1 flex-col bg-blue-50/40 p-3">
          <p className="mb-2 text-xs font-bold text-blue-800">
            🇰🇷 내가 말할 내용 (한국어)
          </p>
          <textarea
            value={koInput}
            onChange={(e) => setKoInput(e.target.value)}
            placeholder="예: 이거 주세요"
            rows={2}
            className="mobile-input mb-2 w-full resize-none rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-base"
          />
          <button
            type="button"
            onClick={() => void translateKoToJa()}
            disabled={loadingKo || !koInput.trim()}
            className="mb-3 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingKo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowUpDown className="h-4 w-4 rotate-90" />
                일본어로 번역 ↓
              </>
            )}
          </button>

          {jaDisplay && (
            <div className="mt-auto rounded-2xl border-2 border-blue-300 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                상대방에게 보여주세요
              </p>
              <p
                className={`mt-2 font-bold leading-snug text-zinc-900 ${displaySize}`}
              >
                {jaDisplay}
              </p>
              {koReading && (
                <p className="mt-2 text-sm font-medium text-violet-600">
                  읽기 · {koReading}
                </p>
              )}
              <button
                type="button"
                onClick={() => void speakText(jaDisplay, "ja")}
                className="mt-3 flex min-h-[44px] items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Volume2 className="h-4 w-4" />
                다시 듣기
              </button>
            </div>
          )}
        </div>

        {/* 일본어 → 한국어 */}
        <div className="flex min-h-0 flex-1 flex-col bg-orange-50/40 p-3">
          <p className="mb-2 text-xs font-bold text-orange-800">
            🇯🇵 상대가 말한 내용 (日本語)
          </p>
          <textarea
            value={jaInput}
            onChange={(e) => setJaInput(e.target.value)}
            placeholder="例: かしこまりました"
            rows={2}
            className="mobile-input mb-2 w-full resize-none rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-base"
          />
          <button
            type="button"
            onClick={() => void translateJaToKo()}
            disabled={loadingJa || !jaInput.trim()}
            className="mb-3 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loadingJa ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowUpDown className="h-4 w-4 -rotate-90" />
                한국어로 번역 ↑
              </>
            )}
          </button>

          {koDisplay && jaInput && (
            <div className="mt-auto rounded-2xl border-2 border-orange-300 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                번역 결과
              </p>
              <p
                className={`mt-2 font-bold leading-snug text-zinc-900 ${displaySize}`}
              >
                {koDisplay}
              </p>
              <button
                type="button"
                onClick={() => void speakText(koDisplay, "ko")}
                className="mt-3 flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white"
              >
                <Volume2 className="h-4 w-4" />
                다시 듣기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
