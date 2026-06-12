"use client";

import { useState } from "react";
import { Crown, Pencil, UserMinus, Users } from "lucide-react";
import { MemberNameModal } from "./MemberNameModal";
import type { PresenceUser, TripMember } from "@/types/database";

type MemberListProps = {
  members: TripMember[];
  onlineUsers: PresenceUser[];
  currentUserId: string;
  creatorId: string | null;
  onUpdateName: (name: string) => Promise<void>;
  onKickMember: (memberId: string) => Promise<void>;
  compact?: boolean;
};

export function MemberList({
  members,
  onlineUsers,
  currentUserId,
  creatorId,
  onUpdateName,
  onKickMember,
  compact = false,
}: MemberListProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const isCreator = Boolean(creatorId && creatorId === currentUserId);

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const currentName = currentMember?.display_name ?? "";

  const handleKick = async (member: TripMember) => {
    if (!isCreator || member.user_id === currentUserId) return;
    const name = member.display_name ?? "멤버";
    if (!window.confirm(`${name} 님을 강퇴하시겠습니까?`)) return;

    setKickingId(member.id);
    try {
      await onKickMember(member.id);
    } finally {
      setKickingId(null);
    }
  };

  return (
    <>
      <div className={compact ? "px-3 py-2" : "border-b border-zinc-200 px-4 py-3"}>
        {!compact && (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <Users className="h-4 w-4" />
              참여 중인 멤버 ({members.length})
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Pencil className="h-3 w-3" />
              내 이름 변경
            </button>
          </div>
        )}

        {compact && (
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Pencil className="h-3 w-3" />
              내 이름 변경
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {members.length === 0 ? (
            <span className="text-xs text-zinc-400">아직 멤버가 없습니다</span>
          ) : (
            members.map((member) => {
              const isOnline = onlineIds.has(member.user_id);
              const isMe = member.user_id === currentUserId;
              const isTripCreator = member.user_id === creatorId;
              const canKick =
                isCreator && !isMe && member.user_id !== creatorId;
              const displayName =
                member.display_name ?? `유저 ${member.user_id.slice(0, 6)}`;

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${
                    isMe
                      ? "bg-blue-50 ring-1 ring-blue-200"
                      : "bg-zinc-50 ring-1 ring-zinc-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      isOnline ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                    title={isOnline ? "온라인" : "오프라인"}
                  />
                  {isTripCreator && (
                    <span title="방장">
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium text-zinc-800">
                    {displayName}
                    {isMe ? " (나)" : ""}
                  </span>
                  {canKick && (
                    <button
                      type="button"
                      onClick={() => handleKick(member)}
                      disabled={kickingId === member.id}
                      className="flex shrink-0 items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-50"
                    >
                      <UserMinus className="h-3 w-3" />
                      {kickingId === member.id ? "처리 중" : "강퇴"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {!compact &&
          (isCreator ? (
            <p className="mt-2 text-[10px] text-zinc-400">
              방장은 다른 멤버 옆 강퇴 버튼으로 보낼 수 있습니다.
            </p>
          ) : (
            <p className="mt-2 text-[10px] text-zinc-400">
              멤버 강퇴는 여행을 만든 방장만 할 수 있습니다.
            </p>
          ))}
      </div>

      <MemberNameModal
        open={editOpen}
        initialName={currentName}
        onSave={async (name) => {
          await onUpdateName(name);
          setEditOpen(false);
        }}
      />
    </>
  );
}
