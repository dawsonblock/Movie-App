"use client";

import { useEffect } from "react";

export function useKeyboardShortcuts({
  onTogglePalette,
}: {
  onTogglePalette?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const meta = isMac ? e.metaKey : e.ctrlKey;

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
