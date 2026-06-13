"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Plus, X } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { isMapsConfigured } from "./MapsProvider";
import { MapsSetupGuide } from "./MapsSetupGuide";
import type { PlaceInput } from "@/types/database";

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

  const overlay = open && (
    <div
      className={`fixed inset-0 flex justify-center bg-black/45 px-4 backdrop-blur-[1px] ${
        compact
          ? "z-[52] items-center"
          : "z-50 items-start pt-[12vh] sm:items-center sm:pt-0"
      }`}
      style={
        compact && keyboardOpen && visibleHeight != null
          ? {
              alignItems: "flex-start",
              paddingTop: offsetTop + 12,
              height: visibleHeight,
            }
          : undefined
      }
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="장소 검색"
        className={`flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl ${
          compact ? "max-w-sm" : "max-w-md"
        }`}
        style={
          compact && keyboardOpen && visibleHeight != null
            ? { maxHeight: Math.max(180, visibleHeight - 32) }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            compact
              ? "flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4"
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

        <div className={compact ? "px-4 pb-4 pt-1" : "p-5 pt-3"}>
          <input
            ref={inputRef}
            type="text"
            placeholder="장소 이름 검색..."
            className="place-search-input mobile-input w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
            disabled={adding}
            autoFocus
          />
          {adding ? (
            <p className="mt-2 text-xs text-blue-600">장소 추가 중...</p>
          ) : (
            <p className="mt-2 text-[11px] text-zinc-400">
              검색 결과에서 장소를 선택하면 일정에 추가됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
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
