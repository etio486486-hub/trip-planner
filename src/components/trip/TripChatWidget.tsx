"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useTripChat } from "@/hooks/useTripChat";

type TripChatWidgetProps = {
  tripId: string;
  currentUserId: string;
  senderName: string;
  isMobile?: boolean;
};

function chatOpenKey(tripId: string) {
  return `trip-planner-chat-open-${tripId}`;
}

function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function ChatMessages({
  listRef,
  loading,
  messages,
  currentUserId,
}: {
  listRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  messages: ReturnType<typeof useTripChat>["messages"];
  currentUserId: string;
}) {
  return (
    <div
      ref={listRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50/80 px-3 py-3"
    >
      {loading ? (
        <div className="flex h-full items-center justify-center py-8 text-xs text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          불러오는 중...
        </div>
      ) : messages.length === 0 ? (
        <p className="py-8 text-center text-xs text-zinc-500">
          첫 메시지를 남겨 보세요.
          <br />
          일정·장소 얘기를 여기서 나눌 수 있어요.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            return (
              <li
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && (
                  <span className="mb-0.5 px-1 text-[10px] font-medium text-zinc-500">
                    {msg.sender_name}
                  </span>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[85%] ${
                    isMe
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md bg-white text-zinc-900 ring-1 ring-zinc-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`mt-1 text-[9px] ${
                      isMe ? "text-blue-100" : "text-zinc-400"
                    }`}
                  >
                    {formatMessageTime(msg.created_at ?? "")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChatInput({
  input,
  setInput,
  sending,
  onSend,
}: {
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-zinc-100 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void onSend();
            }
          }}
          placeholder="메시지 입력..."
          maxLength={500}
          className="mobile-input min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-base sm:text-sm"
        />
        <button
          type="button"
          onClick={() => void onSend()}
          disabled={sending || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          aria-label="보내기"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function TripChatWidget({
  tripId,
  currentUserId,
  senderName,
  isMobile = false,
}: TripChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  const { messages, loading, sending, error, needsMigration, sendMessage } =
    useTripChat(tripId, currentUserId, senderName);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(chatOpenKey(tripId)) === "1");
    } catch {
      /* ignore */
    }
  }, [tripId]);

  const setOpenPersist = useCallback(
    (value: boolean) => {
      setOpen(value);
      try {
        localStorage.setItem(chatOpenKey(tripId), value ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (value) {
        setUnread(0);
        prevMsgCountRef.current = messages.length;
      }
    },
    [tripId, messages.length]
  );

  useEffect(() => {
    if (open) {
      prevMsgCountRef.current = messages.length;
      setUnread(0);
      return;
    }
    if (messages.length <= prevMsgCountRef.current) return;

    const added = messages.slice(prevMsgCountRef.current);
    const fromOthers = added.filter((m) => m.user_id !== currentUserId).length;
    if (fromOthers > 0) {
      setUnread((u) => u + fromOthers);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, open, currentUserId]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!isMobile || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, open]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const ok = await sendMessage(input);
    if (ok) setInput("");
  };

  if (needsMigration) {
    const btn = (
      <button
        type="button"
        title="채팅 (DB 마이그레이션 필요)"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-400 text-white shadow-lg"
        disabled
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );

    if (isMobile && mounted) {
      return createPortal(
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] right-4 z-[45]">
          {btn}
        </div>,
        document.body
      );
    }

    return (
      <div className="pointer-events-auto absolute bottom-4 right-4 z-30">
        {btn}
      </div>
    );
  }

  const fab = (
    <button
      type="button"
      onClick={() => setOpenPersist(!open)}
      className={`relative flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:bg-blue-700 active:scale-95 ${
        open && !isMobile ? "min-h-[44px] gap-2 px-4" : "h-14 w-14"
      }`}
      aria-label={open ? "채팅 닫기" : "멤버 채팅 열기"}
    >
      {open && !isMobile ? (
        <>
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">숨기기</span>
        </>
      ) : (
        <MessageCircle className="h-6 w-6 shrink-0" />
      )}
      {!open && unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );

  /* ── 모바일: viewport 고정 + 바텀시트 ── */
  if (isMobile && mounted) {
    return createPortal(
      <>
        {open && (
          <div
            className="fixed inset-0 z-[48] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpenPersist(false)}
            aria-hidden
          />
        )}

        {open && (
          <div
            className="fixed inset-x-0 bottom-0 z-[50] flex max-h-[min(82dvh,560px)] flex-col overflow-hidden rounded-t-2xl border border-zinc-200/80 bg-white shadow-2xl"
            role="dialog"
            aria-label="멤버 채팅"
          >
            <div className="flex shrink-0 flex-col items-center border-b border-zinc-100 bg-gradient-to-r from-blue-600 to-blue-500 pt-2 text-white">
              <div className="mb-2 h-1 w-10 rounded-full bg-white/40" />
              <div className="flex w-full items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-semibold">멤버 채팅</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenPersist(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/20"
                  aria-label="채팅 닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <ChatMessages
              listRef={listRef}
              loading={loading}
              messages={messages}
              currentUserId={currentUserId}
            />

            {error && (
              <p className="shrink-0 border-t border-red-100 bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
                {error}
              </p>
            )}

            <ChatInput
              input={input}
              setInput={setInput}
              sending={sending}
              onSend={handleSend}
            />
          </div>
        )}

        {!open && (
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] right-4 z-[45]">
            {fab}
          </div>
        )}
      </>,
      document.body
    );
  }

  /* ── 데스크톱: 지도 위 플로팅 ── */
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-30 flex flex-col items-end">
      {open && (
        <div className="pointer-events-auto mb-3 flex h-[min(420px,55vh)] w-[min(340px,calc(100%-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/15">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">멤버 채팅</span>
            </div>
            <button
              type="button"
              onClick={() => setOpenPersist(false)}
              className="flex items-center justify-center rounded-lg p-1 hover:bg-white/20"
              aria-label="채팅 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ChatMessages
            listRef={listRef}
            loading={loading}
            messages={messages}
            currentUserId={currentUserId}
          />

          {error && (
            <p className="shrink-0 border-t border-red-100 bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
              {error}
            </p>
          )}

          <ChatInput
            input={input}
            setInput={setInput}
            sending={sending}
            onSend={handleSend}
          />
        </div>
      )}

      <div className="pointer-events-auto">{fab}</div>
    </div>
  );
}
