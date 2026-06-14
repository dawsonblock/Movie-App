import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

if (!fs.existsSync(standaloneDir)) {
  throw new Error("Missing .next/standalone. Run `next build` first.");
}

if (!fs.existsSync(staticDir)) {
  throw new Error("Missing .next/static. Run `next build` first.");
}

fs.cpSync(staticDir, path.join(standaloneDir, ".next", "static"), { recursive: true });
fs.cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true });

// Do NOT copy .env.local into the bundle — it leaks secrets into the packaged DMG.
// Supply environment variables at runtime instead (e.g., via OS env or electron-builder config).
console.log("Standalone bundle prepared for Electron.");
console.warn(
  "IMPORTANT: Environment variables are NOT embedded. Set them at runtime before launching the app.",
);