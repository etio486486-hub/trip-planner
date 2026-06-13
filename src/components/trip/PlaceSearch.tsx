"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { MapPin, Plus, X } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { isMapsConfigured } from "./MapsProvider";
import { MapsSetupGuide } from "./MapsSetupGuide";
import type { PlaceInput } from "@/types/database";

const MOBILE_NAV_OFFSET =
  "calc(3.75rem + env(safe-area-inset-bottom, 0px))";

type PlaceSearchProps = {
  onAdd: (place: PlaceInput) => Promise<void>;
  compact?: boolean;
};

export function PlaceSearch({ onAdd, compact = false }: PlaceSearchProps) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { visibleHeight, offsetTop, keyboardOpen } = useVisualViewport(
    open && compact
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!placesLib || !inputRef.current || !open) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["place_id", "name", "geometry"],
    });
    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location || !place.name) return;

      setAdding(true);
      onAdd({
        name: place.name,
        google_place_id: place.place_id ?? null,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      })
        .then(() => {
          if (inputRef.current) inputRef.current.value = "";
          setOpen(false);
        })
        .finally(() => setAdding(false));
    });

    return () => {
      google.maps.event.removeListener(listener);
      autocompleteRef.current = null;
    };
  }, [placesLib, open, onAdd]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !compact) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, compact]);

  useEffect(() => {
    if (!open || !compact) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, compact]);

  if (!isMapsConfigured()) {
    return (
      <div className="mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <MapsSetupGuide compact />
      </div>
    );
  }

  const mobileSheetStyle: CSSProperties =
    keyboardOpen && visibleHeight != null
      ? {
          top: `${offsetTop + 8}px`,
          bottom: "auto",
          maxHeight: `${Math.max(160, visibleHeight - 16)}px`,
        }
      : {
          bottom: MOBILE_NAV_OFFSET,
        };

  const overlay = open && (
    <>
      <div
        className={`fixed inset-0 bg-black/45 backdrop-blur-[1px] ${
          compact ? "z-[52]" : "z-50"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="장소 검색"
        className={`fixed flex flex-col overflow-hidden bg-white shadow-2xl ${
          compact
            ? "inset-x-0 z-[53] rounded-t-2xl border border-zinc-200/80"
            : "z-50 w-full max-w-md rounded-t-2xl sm:rounded-xl"
        }`}
        style={
          compact
            ? mobileSheetStyle
            : {
                left: "50%",
                top: "12vh",
                transform: "translateX(-50%)",
                maxWidth: "28rem",
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {compact && (
          <div className="flex shrink-0 justify-center pt-2">
            <div className="h-1 w-10 rounded-full bg-zinc-200" />
          </div>
        )}

        <div
          className={
            compact
              ? "flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-1"
              : "flex items-center justify-between p-5 pb-0"
          }
        >
          <div
            className={`flex items-center gap-2 font-semibold text-zinc-800 ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            <MapPin className="h-4 w-4 text-blue-600" />
            장소 검색
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={compact ? "px-4 pb-3 pt-1" : "p-5 pt-3"}>
          <input
            ref={inputRef}
            type="text"
            placeholder="장소 이름 검색..."
            className="place-search-input mobile-input w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
            disabled={adding}
            autoFocus={!compact}
          />
          {adding ? (
            <p className="mt-2 text-xs text-blue-600">장소 추가 중...</p>
          ) : (
            <p className="mt-2 text-[11px] text-zinc-400">
              검색 결과에서 장소를 선택하면 일정에 추가됩니다.
            </p>
          )}
        </div>

        {compact && !keyboardOpen && (
          <div className="h-[env(safe-area-inset-bottom,0px)] shrink-0" />
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 active:scale-[0.99] ${
          compact
            ? "min-h-[44px] px-4 py-2.5 text-sm"
            : "mx-3 mb-3 min-h-[44px] w-[calc(100%-1.5rem)] rounded-2xl px-4 py-3 text-sm"
        }`}
      >
        <Plus className="h-4 w-4" />
        장소 추가
      </button>

      {open && mounted && typeof document !== "undefined"
        ? createPortal(overlay, document.body)
        : null}
    </>
  );
}
