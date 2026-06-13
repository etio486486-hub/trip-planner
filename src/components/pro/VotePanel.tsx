"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Vote } from "lucide-react";
import { useTripPolls } from "@/hooks/useTripPolls";
import { ProBadge } from "./ProBadge";
import { ProUpgradePanel } from "./ProUpgradePanel";
import { usePro } from "@/hooks/usePro";
import { MigrationNotice } from "@/components/trip/MigrationNotice";
import type { TripPollOption } from "@/types/database";

type VotePanelProps = {
  tripId: string;
  currentUserId: string;
  compact?: boolean;
};

export function VotePanel({
  tripId,
  currentUserId,
  compact = false,
}: VotePanelProps) {
  const { hasFeature } = usePro();
  const canCreate = hasFeature("vote_mode");

  const {
    polls,
    loading,
    error,
    needsMigration,
    createPoll,
    castVote,
    closePoll,
  } = useTripPolls(tripId, currentUserId);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  if (needsMigration) {
    return (
      <div className={compact ? "px-3 py-2" : "px-4 py-3"}>
        <MigrationNotice feature="투표" />
      </div>
    );
  }

  const handleCreate = async () => {
    setCreating(true);
    try {
      const ok = await createPoll(title, options);
      if (ok) {
        setTitle("");
        setOptions(["", ""]);
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    setVoting(`${pollId}-${optionId}`);
    try {
      await castVote(pollId, optionId);
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className={compact ? "px-3 py-2" : "border-b border-white/60 px-4 py-3"}>
      <div className="rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-indigo-50/40 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4 text-violet-700" />
            <span className="text-xs font-bold text-violet-900">투표</span>
            {canCreate && <ProBadge />}
          </div>
          {canCreate && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-violet-700"
            >
              <Plus className="h-3 w-3" />
              새 투표
            </button>
          )}
        </div>

        <p className="mb-2 text-[10px] text-violet-700">
          {canCreate
            ? "맛집·일정 후보를 멤버에게 투표받으세요."
            : "투표에 참여할 수 있습니다. 만들기는 Pro."}
        </p>

        {open && canCreate && (
          <div className="mb-3 space-y-2 rounded-lg bg-white/80 p-2.5 ring-1 ring-violet-100">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 점심 맛집 어디로?"
              className="w-full rounded-lg border border-violet-200 px-2.5 py-2 text-xs"
            />
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
                placeholder={`후보 ${i + 1}`}
                className="w-full rounded-lg border border-violet-200 px-2.5 py-2 text-xs"
              />
            ))}
            {options.length < 5 && (
              <button
                type="button"
                onClick={() => setOptions([...options, ""])}
                className="text-[10px] font-medium text-violet-600 hover:underline"
              >
                + 후보 추가
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating || !title.trim()}
                className="flex-1 rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {creating ? "만드는 중…" : "투표 시작"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-violet-200 px-3 py-2 text-xs text-violet-700"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {!canCreate && (
          <ProUpgradePanel featureId="vote_mode" compact className="mb-2" />
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          </div>
        ) : polls.length === 0 ? (
          <p className="py-2 text-center text-[11px] text-violet-600/80">
            진행 중인 투표가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {polls.map((poll) => {
              const opts = poll.options as TripPollOption[];
              const maxVotes = Math.max(
                1,
                ...opts.map((o) => poll.voteCounts[o.id] ?? 0)
              );

              return (
                <li
                  key={poll.id}
                  className="rounded-lg bg-white/90 p-2.5 ring-1 ring-violet-100"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-zinc-900">
                      {poll.title}
                    </p>
                    {poll.status === "open" &&
                      poll.created_by === currentUserId &&
                      canCreate && (
                        <button
                          type="button"
                          onClick={() => void closePoll(poll.id)}
                          className="shrink-0 text-[10px] text-zinc-400 hover:text-zinc-600"
                        >
                          마감
                        </button>
                      )}
                  </div>

                  <ul className="space-y-1.5">
                    {opts.map((opt) => {
                      const count = poll.voteCounts[opt.id] ?? 0;
                      const pct = Math.round((count / maxVotes) * 100);
                      const isMine = poll.myVote === opt.id;
                      const isVoting =
                        voting === `${poll.id}-${opt.id}`;

                      return (
                        <li key={opt.id}>
                          <button
                            type="button"
                            disabled={
                              poll.status !== "open" || isVoting
                            }
                            onClick={() =>
                              void handleVote(poll.id, opt.id)
                            }
                            className={`relative w-full overflow-hidden rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                              isMine
                                ? "border-violet-400 bg-violet-50"
                                : "border-zinc-200 bg-white hover:border-violet-200"
                            } disabled:opacity-70`}
                          >
                            <div
                              className="absolute inset-y-0 left-0 bg-violet-100/80 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="relative flex items-center justify-between gap-2">
                              <span className="font-medium text-zinc-800">
                                {isMine && (
                                  <Check className="mr-1 inline h-3 w-3 text-violet-600" />
                                )}
                                {opt.label}
                              </span>
                              <span className="shrink-0 text-[10px] text-zinc-500">
                                {count}표
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="mt-1.5 text-[10px] text-zinc-400">
                    총 {poll.totalVotes}명 참여
                    {poll.status === "closed" && " · 마감됨"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {error && (
          <p className="mt-2 text-[11px] text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
