"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Link2, UserPlus } from "lucide-react";
import { buildTripJoinUrl } from "@/lib/trip-access";

type InviteMembersProps = {
  tripId: string;
  inviteCode?: string | null;
  compact?: boolean;
};

export function InviteMembers({
  tripId,
  inviteCode,
  compact = false,
}: InviteMembersProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const productionUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const isPreviewUrl =
    typeof window !== "undefined" &&
    /-git-|-[a-z0-9]+-.*-projects\.vercel\.app$/i.test(window.location.hostname);

  const inviteUrl =
    inviteCode && (productionUrl || typeof window !== "undefined")
      ? buildTripJoinUrl(tripId, inviteCode)
      : productionUrl
        ? `${productionUrl}/trips/${tripId}`
        : typeof window !== "undefined"
          ? `${window.location.origin}/trips/${tripId}`
          : `/trips/${tripId}`;

  const copyText = async (text: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    if (which === "link") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
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
          초대 링크 또는 참여 코드를 공유하세요. 코드·링크 없이는 입장할 수
          없습니다.
        </p>
      )}

      {inviteCode && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs text-zinc-600">참여 코드</span>
            <span className="font-mono text-sm font-bold tracking-widest text-blue-900">
              {inviteCode}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyText(inviteCode, "code")}
            className="text-xs text-blue-600 hover:underline"
          >
            {codeCopied ? "복사됨" : "복사"}
          </button>
        </div>
      )}

      {isPreviewUrl && !productionUrl && (
        <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          지금 Preview 주소입니다. 친구에게는 Production 링크를 보내세요.
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
        onClick={() => copyText(inviteUrl, "link")}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 font-medium text-blue-700 transition-colors hover:bg-blue-100 active:bg-blue-200 ${
          compact ? "min-h-[40px] px-3 py-2 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            링크 복사됨!
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
