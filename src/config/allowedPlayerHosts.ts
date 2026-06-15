/**
 * Third-party player security — single source of truth.
 *
 * CSP is the domain gate. Iframe sandbox is the popup blocker. You need both.
 *
 * This module feeds:
 * - CSP `frame-src` via ALLOWED_PLAYER_FRAME_SRC (next.config.ts)
 * - Runtime iframe validation via isAllowedPlayerUrl (SafeThirdPartyFrame)
 * - Player URL construction via createPlayerSource (utils/players.ts)
 *
 * What CSP blocks:
 * - Loading iframe players from unapproved domains (frame-src)
 * - Loading images from unapproved hosts (img-src)
 * - Connect requests to unapproved APIs (connect-src)
 * - Other sites embedding this app (frame-ancestors)
 *
 * What other security headers block/restrict:
 * - Referrer leakage (Referrer-Policy: strict-origin on iframes — sends origin only,
 *   not full path; required so video CDNs can pass hotlink checks without exposing
 *   the full player URL. Do not use no-referrer: providers blank the video stream.)
 * - MIME sniffing (X-Content-Type-Options)
 * - Browser feature access such as camera, microphone, geolocation, payment (Permissions-Policy)
 *
 * What Electron native handlers block (replacing iframe sandbox):
 * - window.open() popups via setWindowOpenHandler -> { action: "deny" }
 * - Parent-page hijacking / top-level redirects via will-navigate
 * - Forced downloads via will-download
 *
 * What neither blocks:
 * - In-frame ads, overlays, pre-rolls
 * - Fake buttons inside the cross-origin player document
 * - Anything served inside the third-party iframe DOM
 *
 * Note: iframe sandbox was removed because third-party video players detect it
 * and refuse to render video. Electron handlers provide equivalent protection.
 *
 * Use exact origins only — no broad subdomain wildcards unless every subdomain is trusted.
 */
import { PlayersProps } from "@/types";

export const ALLOWED_PLAYER_ORIGINS = [
  // Trusted platforms (no aggressive ads / overlays)
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  // Curated aggregators — monitored for hostile behavior
  "https://vidlink.pro",
  "https://www.vidking.net",
  "https://filmku.stream",
] as const;

export type AllowedPlayerOrigin = (typeof ALLOWED_PLAYER_ORIGINS)[number];

export const ALLOWED_PLAYER_HOSTS = new Set(
  ALLOWED_PLAYER_ORIGINS.map((origin) => new URL(origin).hostname),
);

export const ALLOWED_PLAYER_FRAME_SRC = ["'self'", ...ALLOWED_PLAYER_ORIGINS];

export function isAllowedPlayerUrl(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    return ALLOWED_PLAYER_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export const UNIVERSAL_IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-presentation" as const;

export function createPlayerSource(
  origin: AllowedPlayerOrigin,
  pathAndQuery: string,
): PlayersProps["source"] {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const source = `${origin}${path}`;

  if (!isAllowedPlayerUrl(source)) {
    throw new Error(`Player source is not on the allowlist: ${source}`);
  }

  return source as PlayersProps["source"];
}