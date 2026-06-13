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
    border: "border-slate-200/80",
    headerBg: "bg-gradient-to-r from-blue-50/80 to-indigo-50/50",
    badge: "bg-blue-600 shadow-blue-600/25",
  },
  amber: {
    border: "border-slate-200/80",
    headerBg: "bg-gradient-to-r from-amber-50/80 to-orange-50/50",
    badge: "bg-amber-500 shadow-amber-500/25",
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
      className={`flex h-full flex-col overflow-hidden rounded-2xl border ${styles.border} bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] ${className}`}
    >
      <div
        className={`relative flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-5 py-4 ${styles.headerBg}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.badge} text-white shadow-md`}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">{title}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
              {subtitle}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/80 hover:text-zinc-600"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 lg:max-h-[520px]">
        {children}
      </div>
    </div>
  );
}
