"use client";

import { Users } from "lucide-react";
import type { PresenceUser, TripMember } from "@/types/database";

type MemberListProps = {
  members: TripMember[];
  onlineUsers: PresenceUser[];
};

export function MemberList({ members, onlineUsers }: MemberListProps) {
  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));

  return (
    <div className="border-b border-zinc-200 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700">
        <Users className="h-4 w-4" />
        참여 중인 멤버
      </div>
      <div className="flex flex-wrap gap-2">
        {members.length === 0 ? (
          <span className="text-xs text-zinc-400">아직 멤버가 없습니다</span>
        ) : (
          members.map((member) => {
            const isOnline = onlineIds.has(member.user_id);
            return (
              <div
                key={member.id}
                className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                  title={isOnline ? "온라인" : "오프라인"}
                />
                {member.display_name ?? `유저 ${member.user_id.slice(0, 6)}`}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
