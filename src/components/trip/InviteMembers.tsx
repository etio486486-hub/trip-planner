"use client";

import { useState } from "react";
import { Check, Copy, Link2, UserPlus } from "lucide-react";

type InviteMembersProps = {
  tripId: string;
  compact?: boolean;
};

export function InviteMembers({ tripId, compact = false }: InviteMembersProps) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const productionUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const isPreviewUrl =
    typeof window !== "undefined" &&
    /-git-|-[a-z0-9]+-.*-projects\.vercel\.app$/i.test(window.location.hostname);

  const inviteUrl = productionUrl
    ? `${productionUrl}/trips/${tripId}`
    : typeof window !== "undefined"
      ? `${window.location.origin}/trips/${tripId}`
      : `/trips/${tripId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={compact ? "px-3 py-2" : "border-b border-zinc-200 px-4 py-3"}>
      {!compact && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <UserPlus className="h-4 w-4" />
            멤버 초대
          </div>
          <button
            type="button"
            onClick={() => setShowLink((v) => !v)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showLink ? "숨기기" : "링크 보기"}
          </button>
        </div>
      )}

      {!compact && (
        <p className="mb-2 text-xs leading-relaxed text-zinc-500">
          아래 링크를 카카오톡·문자 등으로 공유하면 친구가 같은 여행에
          참여합니다. 링크를 연 사람은 자동으로 멤버로 추가됩니다.
        </p>
      )}

      {isPreviewUrl && !productionUrl && (
        <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          지금 Preview 주소입니다. 친구에게는{" "}
          <strong>trip-planner-taupe-eta.vercel.app</strong> 로 시작하는
          Production 링크를 보내세요.
        </p>
      )}

      {showLink && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-700">
            {inviteUrl}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={copyLink}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 font-medium text-blue-700 transition-colors hover:bg-blue-100 active:bg-blue-200 ${
          compact ? "min-h-[40px] px-3 py-2 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            복사됨!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            초대 링크 복사
          </>
        )}
      </button>
    </div>
  );
}
