"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getSupabaseErrorMessage,
  isMissingTableError,
} from "@/lib/supabase/errors";
import type { TripMessage } from "@/types/database";

const PAGE_SIZE = 120;

export function useTripChat(
  tripId: string,
  currentUserId: string,
  senderName: string
) {
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsMigration(false);

    try {
      const { data, error: fetchError } = await getSupabase()
        .from("trip_messages")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true })
        .limit(PAGE_SIZE);

      if (fetchError) {
        if (isMissingTableError(fetchError, "trip_messages")) {
          setNeedsMigration(true);
          setMessages([]);
          return;
        }
        throw fetchError;
      }

      setMessages(data ?? []);
    } catch (err) {
      if (isMissingTableError(err, "trip_messages")) {
        setNeedsMigration(true);
        setMessages([]);
      } else {
        setError(getSupabaseErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!isSupabaseConfigured() || needsMigration) return;

    const channel = getSupabase()
      .channel(`chat:trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as TripMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const next = [...prev, row];
            if (next.length > PAGE_SIZE) next.shift();
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [tripId, needsMigration]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !currentUserId || sending) return false;

      if (!isSupabaseConfigured()) {
        setError("Supabase가 설정되지 않았습니다.");
        return false;
      }

      setSending(true);
      setError(null);

      try {
        const { error: insertError } = await getSupabase()
          .from("trip_messages")
          .insert({
            trip_id: tripId,
            user_id: currentUserId,
            sender_name: senderName.trim() || "멤버",
            content: trimmed,
          });

        if (insertError) {
          if (isMissingTableError(insertError, "trip_messages")) {
            setNeedsMigration(true);
            return false;
          }
          throw insertError;
        }
        return true;
      } catch (err) {
        setError(getSupabaseErrorMessage(err));
        return false;
      } finally {
        setSending(false);
      }
    },
    [tripId, currentUserId, senderName, sending]
  );

  return {
    messages,
    loading,
    sending,
    error,
    needsMigration,
    sendMessage,
    reload: loadMessages,
  };
}
