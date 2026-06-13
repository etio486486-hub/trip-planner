"use client";

import { useEffect, useState } from "react";

/** iOS/Android 가상 키보드로 줄어든 보이는 영역 */
export function useVisualViewport(enabled = true) {
  const [height, setHeight] = useState<number | null>(null);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) {
      setHeight(window.innerHeight);
      return;
    }

    const update = () => {
      setHeight(vv.height);
      setOffsetTop(vv.offsetTop);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled]);

  const keyboardOpen =
    height != null &&
    typeof window !== "undefined" &&
    height < window.innerHeight * 0.85;

  return {
    visibleHeight: height,
    offsetTop,
    keyboardOpen,
  };
}
