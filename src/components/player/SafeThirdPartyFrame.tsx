"use client";

/**
 * Wrapper for third-party player iframes.
 *
 * CSP (frame-src) controls which domains may load. The iframe `sandbox` attribute
 * was removed because third-party video players (vidlink.pro, vidking.net, filmku.stream)
 * detect sandboxing and refuse to render video, showing a "disable sandbox" message.
 *
 * Security is preserved by Electron native handlers instead:
 * - setWindowOpenHandler blocks all window.open() popups
 * - will-navigate blocks navigation to external URLs
 * - will-download blocks all download attempts
 */
import { isAllowedPlayerUrl } from "@/config/allowedPlayerHosts";
import { cn } from "@/utils/helpers";
import { useState } from "react";

type SafeThirdPartyFrameProps = {
  src: string;
  title: string;
  className?: string;
};

export function SafeThirdPartyFrame({ src, title, className }: SafeThirdPartyFrameProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!isAllowedPlayerUrl(src)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        This video source is not allowed.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <iframe
        src={src}
        title={title}
        className={cn("h-full w-full", className)}
        allowFullScreen
        referrerPolicy="strict-origin"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      />
      {!dismissed && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Dismiss overlay and interact with player"
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center bg-black/60 text-white backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setDismissed(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setDismissed(true);
            }
          }}
        >
          <p className="max-w-md px-6 text-center text-lg font-semibold">
            Click to start watching
          </p>
          <p className="mt-2 max-w-md px-6 text-center text-sm text-gray-300">
            Popup attempts are blocked. Fake buttons may still appear inside the
            player.
          </p>
        </div>
      )}
      {dismissed && (
        <button
          type="button"
          aria-label="Re-enable player protection overlay"
          title="Re-enable player protection overlay"
          className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setDismissed(false)}
        >
          S
        </button>
      )}
    </div>
  );
}