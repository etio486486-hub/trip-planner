"use client";

import { Crown } from "lucide-react";

type ProBadgeProps = {
  className?: string;
  size?: "sm" | "md";
};

export function ProBadge({ className = "", size = "sm" }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white shadow-sm ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${className}`}
    >
      <Crown className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      PRO
    </span>
  );
}
