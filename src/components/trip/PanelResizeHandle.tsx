"use client";

import { useCallback, useEffect, useRef } from "react";
import { GripHorizontal, GripVertical } from "lucide-react";

type PanelResizeHandleProps = {
  direction: "horizontal" | "vertical";
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
};

export function PanelResizeHandle({
  direction,
  onResize,
  onResizeEnd,
}: PanelResizeHandleProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      lastPos.current = direction === "horizontal" ? e.clientX : e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [direction]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const pos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      onResize(delta);
    },
    [direction, onResize]
  );

  const endDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    onResizeEnd?.();
  }, [onResizeEnd]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const isHorizontal = direction === "horizontal";

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? "vertical" : "horizontal"}
      aria-label={isHorizontal ? "패널 너비 조절" : "패널 높이 조절"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`group z-20 flex shrink-0 items-center justify-center touch-none ${
        isHorizontal
          ? "h-full w-2 cursor-col-resize hover:bg-blue-100/80 active:bg-blue-200/80"
          : "h-6 w-full cursor-row-resize bg-zinc-100 hover:bg-blue-100 active:bg-blue-200 max-lg:h-8"
      }`}
    >
      {isHorizontal ? (
        <GripVertical className="h-5 w-3 text-zinc-300 group-hover:text-blue-400" />
      ) : (
        <GripHorizontal className="h-3 w-5 text-zinc-400 group-hover:text-blue-500" />
      )}
    </div>
  );
}
