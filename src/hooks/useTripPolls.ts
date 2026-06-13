"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getSupabaseErrorMessage,
  isMissingTableError,
} from "@/lib/supabase/errors";
import type { TripPoll, TripPollOption, TripPollVote } from "@/types/database";

export type PollWithVotes = TripPoll & {
  voteCounts: Record<string, number>;
  myVote: string | null;
  totalVotes: number;
};

function parseOptions(raw: unknown): TripPollOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (o): o is TripPollOption =>
      typeof o === "object" &&
      o !== null &&
      typeof (o as TripPollOption).id === "string" &&
      typeof (o as TripPollOption).label === "string"
  );
}

export function useTripPolls(tripId: string, currentUserId: string) {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  const enrichPolls = useCallback(
    async (rawPolls: TripPoll[]) => {
      if (rawPolls.length === 0) {
        setPolls([]);
        return;
      }

      const ids = rawPolls.map((p) => p.id);
      const { data: votes } = await getSupabase()
        .from("trip_poll_votes")
        .select("*")
        .in("poll_id", ids);

      const voteList = (votes ?? []) as TripPollVote[];

      setPolls(
        rawPolls.map((poll) => {
          const pollVotes = voteList.filter((v) => v.poll_id === poll.id);
          const voteCounts: Record<string, number> = {};
          for (const opt of parseOptions(poll.options)) {
            voteCounts[opt.id] = pollVotes.filter(
              (v) => v.option_id === opt.id
            ).length;
          }
          const myVote =
            pollVotes.find((v) => v.user_id === currentUserId)?.option_id ??
            null;

          return {
            ...poll,
            options: parseOptions(poll.options),
            voteCounts,
            myVote,
            totalVotes: pollVotes.length,
          };
        })
      );
    },
    [currentUserId]
  );

  const loadPolls = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsMigration(false);

    try {
      const { data, error: fetchError } = await getSupabase()
        .from("trip_polls")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (fetchError) {
        if (isMissingTableError(fetchError, "trip_polls")) {
          setNeedsMigration(true);
          setPolls([]);
          return;
        }
        throw fetchError;
      }

      await enrichPolls((data ?? []) as TripPoll[]);
    } catch (err) {
      if (isMissingTableError(err, "trip_polls")) {
        setNeedsMigration(true);
        setPolls([]);
      } else {
        setError(getSupabaseErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [tripId, enrichPolls]);

  useEffect(() => {
    void loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    if (!isSupabaseConfigured() || needsMigration) return;

    const channel = getSupabase()
      .channel(`polls:trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_polls",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void loadPolls();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_poll_votes",
        },
        () => {
          void loadPolls();
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [tripId, needsMigration, loadPolls]);

  const createPoll = useCallback(
    async (title: string, optionLabels: string[]) => {
      const labels = optionLabels.map((l) => l.trim()).filter(Boolean);
      if (!title.trim() || labels.length < 2) return false;

      const options: TripPollOption[] = labels.map((label, i) => ({
        id: `opt-${i + 1}`,
        label,
      }));

      const { error: insertError } = await getSupabase()
        .from("trip_polls")
        .insert({
          trip_id: tripId,
          created_by: currentUserId,
          title: title.trim(),
          options,
        });

      if (insertError) {
        if (isMissingTableError(insertError, "trip_polls")) {
          setNeedsMigration(true);
          return false;
        }
        throw insertError;
      }

      await loadPolls();
      return true;
    },
    [tripId, currentUserId, loadPolls]
  );

  const castVote = useCallback(
    async (pollId: string, optionId: string) => {
      const { error: upsertError } = await getSupabase()
        .from("trip_poll_votes")
        .upsert(
          {
            poll_id: pollId,
            user_id: currentUserId,
            option_id: optionId,
          },
          { onConflict: "poll_id,user_id" }
        );

      if (upsertError) {
        if (isMissingTableError(upsertError, "trip_poll_votes")) {
          setNeedsMigration(true);
          return false;
        }
        throw upsertError;
      }

      await loadPolls();
      return true;
    },
    [currentUserId, loadPolls]
  );

  const closePoll = useCallback(
    async (pollId: string) => {
      const { error: updateError } = await getSupabase()
        .from("trip_polls")
        .update({ status: "closed" })
        .eq("id", pollId);

      if (updateError) throw updateError;
      await loadPolls();
    },
    [loadPolls]
  );

  return {
    polls,
    loading,
    error,
    needsMigration,
    createPoll,
    castVote,
    closePoll,
    reload: loadPolls,
  };
}
