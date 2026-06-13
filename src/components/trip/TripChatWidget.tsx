"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function TripChatWidget({
  tripId,
  currentUserId,
  senderName,
  isMobile = false,
}: TripChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  const { messages, loading, sending, error, needsMigration, sendMessage } =
    useTripChat(tripId, currentUserId, senderName);

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

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const ok = await sendMessage(input);
    if (ok) setInput("");
  };

  if (needsMigration) {
    return (
      <div
        className={`pointer-events-auto absolute z-30 ${
          isMobile ? "bottom-14 right-3" : "bottom-4 right-4"
        }`}
      >
        <button
          type="button"
          title="채팅 (DB 마이그레이션 필요)"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-400 text-white shadow-lg"
          disabled
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute z-30 flex flex-col items-end ${
        isMobile ? "bottom-14 right-3" : "bottom-4 right-4"
      }`}
    >
      {open && (
        <div
          className={`pointer-events-auto mb-3 flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/15 ${
            isMobile
              ? "h-[min(52vh,360px)] w-[min(calc(100vw-1.5rem),320px)]"
              : "h-[min(420px,55vh)] w-[min(340px,calc(100%-2rem))]"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">멤버 채팅</span>
            </div>
            <button
              type="button"
              onClick={() => setOpenPersist(false)}
              className="rounded-lg p-1 hover:bg-white/20"
              aria-label="채팅 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50/80 px-2 py-2"
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
              <ul className="space-y-2">
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
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          isMe
                            ? "rounded-br-md bg-blue-600 text-white"
                            : "rounded-bl-md bg-white text-zinc-900 ring-1 ring-zinc-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
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

          {error && (
            <p className="shrink-0 border-t border-red-100 bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
              {error}
            </p>
          )}

          <div className="shrink-0 border-t border-zinc-100 bg-white p-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="메시지 입력..."
                maxLength={500}
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpenPersist(!open)}
        className={`pointer-events-auto relative flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:bg-blue-700 active:scale-95 ${
          open ? "h-11 px-4" : "h-12 w-12 justify-center"
        }`}
        aria-label={open ? "채팅 숨기기" : "멤버 채팅 열기"}
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        {open && <span className="text-sm font-medium">숨기기</span>}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
