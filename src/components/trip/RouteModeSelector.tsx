"use client";

import { Car, Footprints, Train } from "lucide-react";
import {
  ROUTE_MODE_LABELS,
  type RouteViewMode,
} from "@/lib/maps/segment-colors";

type RouteModeSelectorProps = {
  mode: RouteViewMode;
  onChange: (mode: RouteViewMode) => void;
  compact?: boolean;
};

const MODES: {
  id: RouteViewMode;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "WALK", icon: Footprints },
  { id: "DRIVE", icon: Car },
  { id: "TRANSIT", icon: Train },
];

export function RouteModeSelector({
  mode,
  onChange,
  compact = false,
}: RouteModeSelectorProps) {
  return (
    <div
      className={`flex gap-1 rounded-lg bg-white/95 p-1 shadow-lg ring-1 ring-zinc-200 backdrop-blur ${
        compact ? "" : ""
      }`}
    >
      {MODES.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            mode === id
              ? "bg-blue-600 text-white shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {ROUTE_MODE_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
