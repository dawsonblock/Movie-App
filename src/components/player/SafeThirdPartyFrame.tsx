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

type SafeThirdPartyFrameProps = {
  src: string;
  title: string;
  className?: string;
};

export function SafeThirdPartyFrame({ src, title, className }: SafeThirdPartyFrameProps) {
  if (!isAllowedPlayerUrl(src)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        This video source is not allowed.
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      className={cn("h-full w-full", className)}
      allowFullScreen
      referrerPolicy="no-referrer"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      sandbox={UNIVERSAL_IFRAME_SANDBOX}
    />
  );
}