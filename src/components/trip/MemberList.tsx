"use client";

import { useState } from "react";
import { Crown, Pencil, Users, X } from "lucide-react";
import { MemberNameModal } from "./MemberNameModal";
import type { PresenceUser, TripMember } from "@/types/database";

type MemberListProps = {
  members: TripMember[];
  onlineUsers: PresenceUser[];
  currentUserId: string;
  creatorId: string | null;
  onUpdateName: (name: string) => Promise<void>;
  onKickMember: (memberId: string) => Promise<void>;
};

export function MemberList({
  members,
  onlineUsers,
  currentUserId,
  creatorId,
  onUpdateName,
  onKickMember,
}: MemberListProps) {
  const [editOpen, setEditOpen] = useState(false);
  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const isCreator = creatorId === currentUserId;

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const currentName = currentMember?.display_name ?? "";

  const handleKick = async (member: TripMember) => {
    if (!isCreator || member.user_id === currentUserId) return;
    const name = member.display_name ?? "멤버";
    if (!window.confirm(`${name} 님을 강퇴하시겠습니까?`)) return;
    await onKickMember(member.id);
  };

  return (
    <>
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <Users className="h-4 w-4" />
            참여 중인 멤버
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
        <div className="flex flex-wrap gap-2">
          {members.length === 0 ? (
            <span className="text-xs text-zinc-400">아직 멤버가 없습니다</span>
          ) : (
            members.map((member) => {
              const isOnline = onlineIds.has(member.user_id);
              const isMe = member.user_id === currentUserId;
              const isTripCreator = member.user_id === creatorId;
              const canKick =
                isCreator && !isMe && member.user_id !== creatorId;

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                    isMe
                      ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                      : "bg-zinc-100 text-zinc-700"
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
                      <Crown className="h-3 w-3 shrink-0 text-amber-500" />
                    </span>
                  )}
                  <span className="max-w-[80px] truncate">
                    {member.display_name ?? `유저 ${member.user_id.slice(0, 6)}`}
                    {isMe ? " (나)" : ""}
                  </span>
                  {canKick && (
                    <button
                      type="button"
                      onClick={() => handleKick(member)}
                      className="ml-0.5 rounded p-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-600"
                      title="강퇴"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        {isCreator && (
          <p className="mt-2 text-[10px] text-zinc-400">
            방장은 다른 멤버 옆 X 버튼으로 강퇴할 수 있습니다.
          </p>
        )}
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
