"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { SettingsSheet } from "./SettingsSheet";

type SettingsTriggerProps = {
  compact?: boolean;
  className?: string;
};

export function SettingsTrigger({
  compact = false,
  className = "",
}: SettingsTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? `rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/80 hover:text-zinc-800 ${className}`
            : `flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-white ${className}`
        }
        title="설정"
        aria-label="설정"
      >
        <Settings className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {!compact && <span>설정</span>}
      </button>
      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
