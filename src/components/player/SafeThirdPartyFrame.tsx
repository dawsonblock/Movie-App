"use client";

/**
 * Sandboxed wrapper for third-party player iframes.
 *
 * CSP (frame-src) controls which domains may load. This component's sandbox attribute
 * blocks popup/tab-hijack behavior from those embedded platforms — CSP does not do that.
 *
 * Do not add: allow-popups, allow-popups-to-escape-sandbox, allow-top-navigation,
 * allow-top-navigation-by-user-activation, or allow-downloads.
 */
import { isAllowedPlayerUrl, UNIVERSAL_IFRAME_SANDBOX } from "@/config/allowedPlayerHosts";
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
        referrerPolicy="no-referrer"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        sandbox={UNIVERSAL_IFRAME_SANDBOX}
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
    </div>
  );
}