import withPWAInit from "@ducanh2912/next-pwa";
import { NextConfig } from "next/dist/server/config";
import path from "path";
import { fileURLToPath } from "url";
import { ALLOWED_PLAYER_FRAME_SRC } from "./src/config/allowedPlayerHosts";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

// ALLOWED_PLAYER_FRAME_SRC is derived from ALLOWED_PLAYER_ORIGINS in allowedPlayerHosts.ts.
// Referrer-Policy, X-Content-Type-Options, and Permissions-Policy are separate headers — not CSP.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://image.tmdb.org http://image.tmdb.org https://dancyflix.com https://wallpapercave.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.themoviedb.org https://*.supabase.co http://127.0.0.1:54321 ws://127.0.0.1:54321 wss://*.supabase.co https://vitals.vercel-insights.com",
      `frame-src ${ALLOWED_PLAYER_FRAME_SRC.join(" ")}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "Referrer-Policy",
    value: "no-referrer",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  // https://github.com/payloadcms/payload/issues/12550#issuecomment-2939070941
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  experimental: {
    optimizePackageImports: ["@heroui/react"],
    prefetchInlining: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

const pwa = withPWA(nextConfig);

export default pwa;