"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type HomeSidePanelProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: "blue" | "amber";
  children: ReactNode;
  onClose?: () => void;
  className?: string;
};

const accentStyles = {
  blue: {
    border: "border-blue-200/60",
    glow: "from-blue-500/10 via-white to-indigo-50/80",
    badge: "bg-blue-600",
  },
  amber: {
    border: "border-amber-200/60",
    glow: "from-amber-400/10 via-white to-orange-50/80",
    badge: "bg-amber-500",
  },
};

export function HomeSidePanel({
  title,
  subtitle,
  icon,
  accent,
  children,
  onClose,
  className = "",
}: HomeSidePanelProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.glow} p-4 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />

      <div className="relative mb-4 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.badge} text-white shadow-md`}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900">{title}</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              {subtitle}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/70 hover:text-zinc-600"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative max-h-[calc(100vh-8rem)] overflow-y-auto pr-0.5">
        {children}
      </div>
    </div>
  );
}
