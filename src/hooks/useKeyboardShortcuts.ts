"use client";

import { useEffect, useRef } from "react";

export function useKeyboardShortcuts({
  onTogglePalette,
}: {
  onTogglePalette?: () => void;
}) {
  const isMacRef = useRef(/macintosh|mac os x/i.test(navigator.userAgent));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = isMacRef.current ? e.metaKey : e.ctrlKey;

      // CMD/CTRL + K: Toggle command palette
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onTogglePalette?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onTogglePalette]);
}
