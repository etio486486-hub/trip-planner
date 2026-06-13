"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPreferredAudioMimeType,
  isServerSttSupported,
  transcribeAudio,
} from "@/lib/stt-client";
import { requestMicrophonePermission } from "@/lib/translator-device";
import type { TranslateLang } from "@/lib/translate-client";

const MAX_RECORD_MS = 30_000;

type UseServerVoiceInputOptions = {
  lang: TranslateLang;
  enabled: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
};

export function useServerVoiceInput({
  lang,
  enabled,
  onTranscript,
  onError,
}: UseServerVoiceInputOptions) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const maxTimerRef = useRef<number | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (maxTimerRef.current !== null) {
      window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      cleanupStream();
      setRecording(false);
    }
  }, [cleanupStream]);

  const startRecording = useCallback(async () => {
    if (!enabled) return;

    if (!isServerSttSupported()) {
      onError("이 기기에서는 Pro 음성 입력을 지원하지 않습니다.");
      return;
    }

    const permitted = await requestMicrophonePermission();
    if (!permitted) {
      onError("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getPreferredAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanupStream();
        setRecording(false);
        setProcessing(false);
        onError("녹음 중 오류가 발생했습니다.");
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        cleanupStream();
        setRecording(false);

        if (blob.size === 0) {
          onError("녹음된 내용이 없습니다.");
          return;
        }

        setProcessing(true);
        void transcribeAudio(blob, lang)
          .then((text) => {
            onTranscript(text);
          })
          .catch((err) => {
            onError(
              err instanceof Error ? err.message : "음성 인식에 실패했습니다."
            );
          })
          .finally(() => {
            setProcessing(false);
          });
      };

      recorder.start();
      setRecording(true);

      maxTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, MAX_RECORD_MS);
    } catch {
      cleanupStream();
      setRecording(false);
      onError("마이크를 사용할 수 없습니다.");
    }
  }, [enabled, lang, onError, onTranscript, cleanupStream, stopRecording]);

  const toggle = useCallback(() => {
    if (processing) return;
    if (recording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }, [processing, recording, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    recording,
    processing,
    supported: isServerSttSupported(),
    startRecording,
    stopRecording,
    toggle,
  };
}
