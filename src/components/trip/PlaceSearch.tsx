"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Plus, X } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
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

  if (!isMapsConfigured()) {
    return (
      <div className="mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <MapsSetupGuide compact />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 active:scale-[0.99] ${
          compact
            ? "min-h-[48px] px-4 py-3 text-sm"
            : "mx-3 mb-3 min-h-[44px] w-[calc(100%-1.5rem)] rounded-2xl px-4 py-3 text-sm"
        }`}
      >
        <Plus className="h-4 w-4" />
        장소 추가
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-start sm:justify-center sm:px-4 sm:pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl safe-bottom sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-semibold text-zinc-800">
                <MapPin className="h-5 w-5 text-blue-600" />
                장소 검색
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="touch-min flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="장소 이름을 검색하세요..."
              className="place-search-input mobile-input w-full rounded-lg border border-zinc-300 px-4 py-3.5 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:py-3 sm:text-sm"
              disabled={adding}
              autoFocus
            />
            {adding && (
              <p className="mt-3 text-sm text-blue-600">장소 추가 중...</p>
            )}
            <p className="mt-3 text-xs text-zinc-400">
              검색 후 목록에서 장소를 선택하면 추가됩니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
