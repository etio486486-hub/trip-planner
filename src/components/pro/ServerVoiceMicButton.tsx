"use client";

import { Loader2, Mic, MicOff } from "lucide-react";
import { useServerVoiceInput } from "@/hooks/useServerVoiceInput";
import type { TranslateLang } from "@/lib/translate-client";
import { ProBadge } from "./ProBadge";

type ServerVoiceMicButtonProps = {
  lang: TranslateLang;
  enabled: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
  className?: string;
  label?: string;
  compact?: boolean;
};

export function ServerVoiceMicButton({
  lang,
  enabled,
  onTranscript,
  onError,
  className = "",
  label = "Pro 음성 입력",
  compact = false,
}: ServerVoiceMicButtonProps) {
  const { recording, processing, supported, toggle } = useServerVoiceInput({
    lang,
    enabled,
    onTranscript,
    onError,
  });

  if (!supported) return null;

  const busy = recording || processing;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!enabled || (processing && !recording)}
      className={`flex items-center justify-center gap-2 rounded-xl font-medium text-white transition-colors disabled:opacity-50 ${
        compact
          ? "min-h-[40px] px-3 py-2 text-xs"
          : "min-h-[48px] flex-1 px-4 py-3.5 text-sm"
      } ${
        recording
          ? "bg-red-600 hover:bg-red-700"
          : "bg-violet-600 hover:bg-violet-700"
      } ${className}`}
    >
      {processing && !recording ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          인식 중…
        </>
      ) : recording ? (
        <>
          <MicOff className="h-4 w-4" />
          {compact ? "완료" : "듣는 중… 끝내기"}
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          {label}
          <ProBadge />
        </>
      )}
    </button>
  );
}
